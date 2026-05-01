// src/lib/moSync.js
// Sync engine for maintenance_orders + mo_tags cache.
//
// Mirrors poSync.js exactly — same state machine, same delta sync pattern,
// same Realtime subscription approach.
//
// Assets and team_members are synced here too since they are small, rarely
// updated registries that MO creation depends on. They share the same
// lastSyncedAt bookmark under separate _meta keys.
//
// Flow:
//   1. App boot → check if cached userId matches current user
//      - Mismatch: clear MO/asset/team cache, full fetch
//      - Match: delta fetch since lastSyncedAt per entity
//   2. Upsert fetched rows into Dexie
//   3. Subscribe to Supabase Realtime on maintenance_orders
//   4. useLiveQuery in consumers auto-rerenders on any Dexie write

import db from './db'
import { supabase } from './supabase'

const MO_CACHE_SELECT = `
  id,
  mo_number,
  title,
  asset_id,
  type,
  department,
  service_provider,
  handler,
  item_description,
  item_price,
  currency,
  requires_ceo,
  status,
  created_by,
  created_at,
  updated_at,
  tags:mo_tags(id, mo_id, tag)
`

let channel = null
let syncActive = false
let channelCounter = 0

// ─────────────────────────────────────────
// Sync state — separate from PO sync state
// ─────────────────────────────────────────
let _syncState = 'idle'
const _listeners = new Set()

function setSyncState(next) {
  if (_syncState === next) return
  _syncState = next
  _listeners.forEach(fn => fn(next))
}

export function getMOSyncState() {
  return _syncState
}

export function subscribeMOSyncState(callback) {
  _listeners.add(callback)
  return () => _listeners.delete(callback)
}

// ─────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────

async function upsertMOsWithTags(rows) {
  if (!rows?.length) return

  const moHeaders = []
  const tags = []

  for (const row of rows) {
    const { tags: rowTags, ...header } = row
    moHeaders.push(header)
    if (rowTags?.length) tags.push(...rowTags)
  }

  await db.transaction('rw', db.maintenance_orders, db.mo_tags, async () => {
    await db.maintenance_orders.bulkPut(moHeaders)
    if (tags.length) await db.mo_tags.bulkPut(tags)
  })
}

// ─────────────────────────────────────────
// Public API
// ─────────────────────────────────────────

/**
 * Start MO sync for the given user.
 * Call alongside startSync (PO) in RootLayout mount.
 */
export async function startMOSync(userId) {
  if (syncActive) return
  syncActive = true
  realtimeRetries = 0

  setSyncState('syncing')

  try {
    // User-switch detection — keyed separately from PO sync
    const cachedUser = await db._meta.get('mo_userId')
    if (cachedUser?.value !== userId) {
      await clearMOCache()
      await db._meta.put({ key: 'mo_userId', value: userId })
    }

    await syncMOs()
    await syncAssets()
    await syncTeamMembers()

    setSyncState('updated')
    subscribeRealtime()
  } catch (err) {
    console.error('[moSync] startMOSync error:', err)
    syncActive = false
    setSyncState('offline')
  }
}

async function syncMOs() {
  const meta = await db._meta.get('mo_lastSyncedAt')
  const lastSyncedAt = meta?.value ?? null

  let query = supabase
    .from('maintenance_orders')
    .select(MO_CACHE_SELECT)
    .order('created_at', { ascending: false })

  if (lastSyncedAt) {
    query = query.gte('updated_at', lastSyncedAt)
  }

  const { data, error } = await query
  if (error) {
    console.error('[moSync] MO fetch error:', error)
    throw error
  }

  await upsertMOsWithTags(data)
  await db._meta.put({ key: 'mo_lastSyncedAt', value: new Date().toISOString() })
}

async function syncAssets() {
  const meta = await db._meta.get('assets_lastSyncedAt')
  const lastSyncedAt = meta?.value ?? null

  let query = supabase
    .from('assets')
    .select('*')
    .order('created_at', { ascending: false })

  if (lastSyncedAt) {
    query = query.gte('updated_at', lastSyncedAt)
  }

  const { data, error } = await query
  if (error) {
    console.error('[moSync] assets fetch error:', error)
    throw error
  }

  if (data?.length) await db.assets.bulkPut(data)
  await db._meta.put({ key: 'assets_lastSyncedAt', value: new Date().toISOString() })
}

async function syncTeamMembers() {
  const meta = await db._meta.get('team_lastSyncedAt')
  const lastSyncedAt = meta?.value ?? null

  let query = supabase
    .from('team_members')
    .select('*')
    .order('created_at', { ascending: false })

  if (lastSyncedAt) {
    query = query.gte('updated_at', lastSyncedAt)
  }

  const { data, error } = await query
  if (error) {
    console.error('[moSync] team_members fetch error:', error)
    throw error
  }

  if (data?.length) await db.team_members.bulkPut(data)
  await db._meta.put({ key: 'team_lastSyncedAt', value: new Date().toISOString() })
}

export function stopMOSync() {
  if (channel) {
    supabase.removeChannel(channel)
    channel = null
  }
  syncActive = false
}

export async function clearMOCache() {
  await db.transaction('rw',
    db.maintenance_orders,
    db.mo_tags,
    db.assets,
    db.team_members,
    db._meta,
    async () => {
      await db.maintenance_orders.clear()
      await db.mo_tags.clear()
      await db.assets.clear()
      await db.team_members.clear()
      // Clear MO-specific meta keys only — leave PO meta untouched
      await db._meta.delete('mo_userId')
      await db._meta.delete('mo_lastSyncedAt')
      await db._meta.delete('assets_lastSyncedAt')
      await db._meta.delete('team_lastSyncedAt')
    }
  )
}

export async function forceMOResync(userId) {
  stopMOSync()
  await clearMOCache()
  if (userId) {
    await db._meta.put({ key: 'mo_userId', value: userId })
  }
  await startMOSync(userId)
}

// ─────────────────────────────────────────
// Realtime subscription (maintenance_orders only)
// Assets and team_members change infrequently — delta sync on next boot is sufficient.
// Add separate subscriptions here if live asset updates become a requirement.
// ─────────────────────────────────────────

let realtimeRetries = 0
const MAX_REALTIME_RETRIES = 3
const RETRY_DELAY = 5000

function subscribeRealtime() {
  if (channel) {
    supabase.removeChannel(channel)
  }

  channelCounter += 1
  const channelName = `mo-sync-${channelCounter}`

  channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'maintenance_orders' },
      async (payload) => {
        try {
          if (payload.eventType === 'DELETE') {
            if (payload.old?.id) {
              await db.transaction('rw', db.maintenance_orders, db.mo_tags, async () => {
                await db.maintenance_orders.delete(payload.old.id)
                await db.mo_tags.where('mo_id').equals(payload.old.id).delete()
              })
            }
          } else {
            // Realtime payload is MO header only — tags not included.
            // Tags are immutable after creation so the cached copy stays valid.
            if (payload.new?.id) {
              await db.maintenance_orders.put(payload.new)
            }
          }

          setSyncState('live')
        } catch (err) {
          console.error('[moSync] realtime handler error:', err)
        }
      }
    )
    .subscribe((status, err) => {
      console.log('[moSync] realtime subscribe status:', status, err ?? '')
      if (status === 'SUBSCRIBED') {
        realtimeRetries = 0
        setSyncState('live')
      } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
        console.warn(`[moSync] Realtime ${status} (attempt ${realtimeRetries + 1}/${MAX_REALTIME_RETRIES})`)
        setSyncState('updated')

        if (realtimeRetries < MAX_REALTIME_RETRIES) {
          realtimeRetries += 1
          setTimeout(() => subscribeRealtime(), RETRY_DELAY)
        } else {
          console.warn('[moSync] Realtime retries exhausted — staying on updated')
        }
      } else if (status === 'CLOSED') {
        if (realtimeRetries === 0) {
          setSyncState('offline')
        }
      }
    })
}