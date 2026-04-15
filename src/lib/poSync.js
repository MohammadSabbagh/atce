// src/lib/poSync.js
// Sync engine for purchase_orders + po_line_items cache.
//
// Flow:
//   1. App boot → check if cached userId matches current user
//      - Mismatch (role switch / first use): clear DB, full fetch
//      - Match: delta fetch since lastSyncedAt
//   2. Upsert fetched PO rows into Dexie; extract + upsert their line items
//   3. Subscribe to Supabase Realtime → upsert/delete PO headers in Dexie on every change
//      Note: Realtime payloads are PO-header-only (no line items). Line items are
//      immutable after creation, so this is safe. If line item editing is added later,
//      a separate Realtime subscription on po_line_items will be needed.
//   4. useLiveQuery in consumers auto-rerenders on any Dexie write
//
// No soft-delete handling — POs are never hard-deleted, only status-changed.

import db from './db'
import { supabase } from './supabase'

// PO header fields + nested line items for cache.
// department lives on each line item (not on the PO header) —
// a single PO can span multiple departments across its line items.
const PO_CACHE_SELECT = `
  id,
  po_number,
  title,
  requires_ceo,
  status,
  total,
  created_by,
  created_at,
  updated_at,
  line_items:po_line_items(id, po_id, description, department, quantity, unit_price, sort_order)
`

let channel = null
let syncActive = false
let channelCounter = 0

// ─────────────────────────────────────────
// Sync state — lightweight pub/sub
// ─────────────────────────────────────────
// States: 'idle' | 'offline' | 'syncing' | 'updated' | 'live'
let _syncState = 'idle'
const _listeners = new Set()

function setSyncState(next) {
  if (_syncState === next) return
  _syncState = next
  _listeners.forEach(fn => fn(next))
}

/** Get current sync state snapshot. */
export function getSyncState() {
  return _syncState
}

/**
 * Subscribe to sync state changes.
 * Returns an unsubscribe function.
 */
export function subscribeSyncState(callback) {
  _listeners.add(callback)
  return () => _listeners.delete(callback)
}

// ─────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────

/**
 * Split a Supabase response array into PO headers and flat line items,
 * then upsert both tables in a single Dexie transaction.
 */
async function upsertPOsWithLineItems(rows) {
  if (!rows?.length) return

  const poHeaders  = []
  const lineItems  = []

  for (const row of rows) {
    const { line_items, ...header } = row
    poHeaders.push(header)
    if (line_items?.length) {
      lineItems.push(...line_items)
    }
  }

  await db.transaction('rw', db.purchase_orders, db.po_line_items, async () => {
    await db.purchase_orders.bulkPut(poHeaders)
    if (lineItems.length) {
      await db.po_line_items.bulkPut(lineItems)
    }
  })
}

// ─────────────────────────────────────────
// Public API
// ─────────────────────────────────────────

/**
 * Start sync for the given user.
 * Call once when entering the authenticated shell (e.g. RootLayout mount).
 */
export async function startSync(userId) {
  if (syncActive) return
  syncActive = true
  realtimeRetries = 0

  setSyncState('syncing')

  try {
    // Check if cache belongs to a different user (role switch)
    const cachedUser = await db._meta.get('userId')
    if (cachedUser?.value !== userId) {
      await clearCache()
      await db._meta.put({ key: 'userId', value: userId })
    }

    // Delta or full sync
    const meta = await db._meta.get('lastSyncedAt')
    const lastSyncedAt = meta?.value ?? null

    let query = supabase
      .from('purchase_orders')
      .select(PO_CACHE_SELECT)
      .order('created_at', { ascending: false })

    if (lastSyncedAt) {
      // Only fetch POs changed since last sync.
      // Line items are immutable after creation — if the PO updated_at changed,
      // we re-fetch its line items too (they're nested in the select).
      query = query.gte('updated_at', lastSyncedAt)
    }

    const { data, error } = await query

    if (error) {
      console.error('[poSync] fetch error:', error)
      setSyncState('offline')
      syncActive = false
      return
    }

    await upsertPOsWithLineItems(data)

    // Stamp sync time
    await db._meta.put({
      key: 'lastSyncedAt',
      value: new Date().toISOString(),
    })

    setSyncState('updated')
    subscribeRealtime()
  } catch (err) {
    console.error('[poSync] startSync error:', err)
    syncActive = false
    setSyncState('offline')
  }
}

/**
 * Stop Realtime subscription and reset sync flag.
 * Call on layout unmount, logout, or before restarting sync.
 */
export function stopSync() {
  if (channel) {
    supabase.removeChannel(channel)
    channel = null
  }
  syncActive = false
}

/**
 * Clear all cached PO data and sync metadata.
 * Called on user switch or explicit logout.
 */
export async function clearCache() {
  await db.transaction('rw', db.purchase_orders, db.po_line_items, db._meta, async () => {
    await db.purchase_orders.clear()
    await db.po_line_items.clear()
    await db._meta.clear()
  })
}

/**
 * Force a full re-sync (clear + fetch all).
 * Useful as a manual recovery if data looks stale.
 */
export async function forceResync(userId) {
  stopSync()
  await clearCache()
  if (userId) {
    await db._meta.put({ key: 'userId', value: userId })
  }
  await startSync(userId)
}

// ─────────────────────────────────────────
// Realtime subscription
// ─────────────────────────────────────────

let realtimeRetries = 0
const MAX_REALTIME_RETRIES = 3
const RETRY_DELAY = 5000 // 5s between retries

function subscribeRealtime() {
  if (channel) {
    supabase.removeChannel(channel)
  }

  channelCounter += 1
  const channelName = `po-sync-${channelCounter}`

  channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'purchase_orders' },
      async (payload) => {
        try {
          if (payload.eventType === 'DELETE') {
            if (payload.old?.id) {
              // Cascade delete line items from cache too
              await db.transaction('rw', db.purchase_orders, db.po_line_items, async () => {
                await db.purchase_orders.delete(payload.old.id)
                await db.po_line_items.where('po_id').equals(payload.old.id).delete()
              })
            }
          } else {
            // Realtime payload is PO header only — no line_items nested.
            // Line items are immutable after creation so the cached copy stays valid.
            // Only the PO header (status, total, updated_at, etc.) changes via Realtime.
            if (payload.new?.id) {
              await db.purchase_orders.put(payload.new)
            }
          }

          setSyncState('live')
        } catch (err) {
          console.error('[poSync] realtime handler error:', err)
        }
      }
    )
    .subscribe((status, err) => {
      console.log('[poSync] realtime subscribe status:', status, err ?? '')
      if (status === 'SUBSCRIBED') {
        realtimeRetries = 0
        setSyncState('live')
      } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
        console.warn(`[poSync] Realtime ${status} (attempt ${realtimeRetries + 1}/${MAX_REALTIME_RETRIES})`)
        setSyncState('updated')

        if (realtimeRetries < MAX_REALTIME_RETRIES) {
          realtimeRetries += 1
          setTimeout(() => subscribeRealtime(), RETRY_DELAY)
        } else {
          console.warn('[poSync] Realtime retries exhausted — staying on updated')
        }
      } else if (status === 'CLOSED') {
        if (realtimeRetries === 0) {
          setSyncState('offline')
        }
      }
    })
}