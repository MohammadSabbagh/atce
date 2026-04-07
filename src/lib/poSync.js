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
      // Don't throw — stale cache is better than no cache
    } else if (data?.length) {
      await db.purchase_orders.bulkPut(data)
    }

    // Stamp sync time
    await db._meta.put({
      key: 'lastSyncedAt',
      value: new Date().toISOString(),
    })

    // Start Realtime subscription
    subscribeRealtime()
  } catch (err) {
    console.error('[poSync] startSync error:', err)
    syncActive = false
  }
}

/**
 * Stop Realtime subscription.
 * Call on layout unmount or logout.
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
  syncActive = false
  await startSync(userId)
}

// ─────────────────────────────────────────
// Realtime subscription
// ─────────────────────────────────────────

function subscribeRealtime() {
  // Clean up any existing channel first
  if (channel) {
    supabase.removeChannel(channel)
  }

  channel = supabase
    .channel('po-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'purchase_orders' },
      async (payload) => {
        try {
          if (payload.eventType === 'DELETE') {
            // payload.old only has the PK by default
            if (payload.old?.id) {
              await db.purchase_orders.delete(payload.old.id)
            }
          } else {
            // INSERT or UPDATE — payload.new is the full row
            if (payload.new?.id) {
              await db.purchase_orders.put(payload.new)
            }
          }
        } catch (err) {
          console.error('[poSync] realtime handler error:', err)
        }
      }
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.warn('[poSync] Realtime channel error — will retry automatically')
      }
    })
}