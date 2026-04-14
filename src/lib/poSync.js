// src/lib/poSync.js
// Sync engine for purchase_orders cache.
//
// Flow:
//   1. App boot → check if cached userId matches current user
//      - Mismatch (role switch / first use): clear DB, full fetch
//      - Match: delta fetch since lastSyncedAt
//   2. Upsert fetched rows into Dexie
//   3. Subscribe to Supabase Realtime → upsert/delete in Dexie on every change
//   4. useLiveQuery in consumers auto-rerenders on any Dexie write
//
// No soft-delete handling — POs are never hard-deleted, only status-changed.

import db from './db'
import { supabase } from './supabase'

// Fields cached for list + dashboard views.
// Realtime payloads include all columns — extra fields are stored harmlessly.
const PO_CACHE_SELECT = `
  id,
  po_number,
  title,
  date,
  department,
  requires_ceo,
  status,
  total,
  created_by,
  updated_at
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
      .order('date', { ascending: false })

    if (lastSyncedAt) {
      // Only fetch rows changed since last sync
      query = query.gte('updated_at', lastSyncedAt)
    }

    const { data, error } = await query

    if (error) {
      console.error('[poSync] fetch error:', error)
      // Fetch failed — treat as offline regardless of navigator.onLine.
      // navigator.onLine is unreliable on mobile (WiFi connected but no internet).
      // The fetch result is ground truth.
      setSyncState('offline')
      syncActive = false
      return
    }

    if (data?.length) {
      await db.purchase_orders.bulkPut(data)
    }

    // Stamp sync time
    await db._meta.put({
      key: 'lastSyncedAt',
      value: new Date().toISOString(),
    })

    // Fetch done, data committed → updated
    setSyncState('updated')

    // Start Realtime subscription
    subscribeRealtime()
  } catch (err) {
    console.error('[poSync] startSync error:', err)
    syncActive = false
    // Exception during fetch/write = can't sync = offline
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
  // Don't change state here — caller decides next state
}

/**
 * Clear all cached PO data and sync metadata.
 * Called on user switch or explicit logout.
 */
export async function clearCache() {
  await db.purchase_orders.clear()
  await db._meta.clear()
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
  // Clean up any existing channel first
  if (channel) {
    supabase.removeChannel(channel)
  }

  // Unique channel name each time — reusing the same name after removeChannel
  // can cause Supabase's realtime client to silently fail to re-subscribe.
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
              await db.purchase_orders.delete(payload.old.id)
            }
          } else {
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
        realtimeRetries = 0 // reset on success
        setSyncState('live')
      } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
        console.warn(`[poSync] Realtime ${status} (attempt ${realtimeRetries + 1}/${MAX_REALTIME_RETRIES})`)
        // Data IS synced (fetch succeeded) — stay on 'updated', not 'offline'.
        // 'offline' should mean we can't reach the server at all.
        setSyncState('updated')

        if (realtimeRetries < MAX_REALTIME_RETRIES) {
          realtimeRetries += 1
          setTimeout(() => subscribeRealtime(), RETRY_DELAY)
        } else {
          console.warn('[poSync] Realtime retries exhausted — staying on updated')
        }
      } else if (status === 'CLOSED') {
        // CLOSED fires both on intentional stopSync() AND automatically
        // after CHANNEL_ERROR. Ignore it during active retries to avoid
        // flashing 'offline' between retry attempts.
        if (realtimeRetries === 0) {
          setSyncState('offline')
        }
      }
    })
}