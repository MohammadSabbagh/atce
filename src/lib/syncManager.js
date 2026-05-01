// src/lib/syncManager.js
//
// Global sync orchestrator.
// All entity syncs (PO, MO, future HR etc.) register here.
// The manager owns the single unified sync state that the UI reads.
//
// Adding a new sync in the future:
//   1. Create your sync module (e.g. hrSync.js) mirroring poSync.js
//   2. Call registerSync('hr', { ... }) at the bottom of this file
//   Done. No other changes needed.
//
// State merging priority (highest wins):
//   offline > syncing > updated > live > idle

import {
  startSync,
  stopSync,
  clearCache,
  getSyncState,
  subscribeSyncState,
} from './poSync'

import {
  startMOSync,
  stopMOSync,
  clearMOCache,
  getMOSyncState,
  subscribeMOSyncState,
} from './moSync'

// ─────────────────────────────────────────
// Registry
// ─────────────────────────────────────────

const STATE_PRIORITY = ['offline', 'syncing', 'updated', 'live', 'idle']

/**
 * @typedef {Object} SyncEntry
 * @property {(userId: string) => Promise<void>} start
 * @property {() => void} stop
 * @property {() => Promise<void>} clear
 * @property {() => string} getState
 * @property {(cb: Function) => Function} subscribe  — returns unsubscribe fn
 */

/** @type {Map<string, SyncEntry>} */
const registry = new Map()

/**
 * Register a sync module with the manager.
 * Call this for each entity sync at module load time (bottom of this file).
 *
 * @param {string} key - unique name e.g. 'po', 'mo', 'hr'
 * @param {SyncEntry} entry
 */
export function registerSync(key, entry) {
  registry.set(key, entry)
}

// ─────────────────────────────────────────
// Unified state
// ─────────────────────────────────────────

let _unifiedState = 'idle'
const _listeners = new Set()

function setUnifiedState(next) {
  if (_unifiedState === next) return
  _unifiedState = next
  _listeners.forEach(fn => fn(next))
}

function recalcUnifiedState() {
  let highest = 'idle'

  for (const entry of registry.values()) {
    const s = entry.getState()
    if (STATE_PRIORITY.indexOf(s) < STATE_PRIORITY.indexOf(highest)) {
      highest = s
    }
  }

  setUnifiedState(highest)
}

/** Get current unified sync state snapshot. */
export function getUnifiedSyncState() {
  return _unifiedState
}

/**
 * Subscribe to unified sync state changes.
 * Returns an unsubscribe function.
 */
export function subscribeUnifiedSyncState(callback) {
  _listeners.add(callback)
  return () => _listeners.delete(callback)
}

// ─────────────────────────────────────────
// Orchestration
// ─────────────────────────────────────────

/**
 * Start all registered syncs for the given user.
 * Call once in RootLayout on mount.
 */
export async function startAllSyncs(userId) {
  await Promise.all(
    [...registry.values()].map(entry => entry.start(userId))
  )
}

/**
 * Stop all registered syncs.
 * Call in RootLayout on unmount and in AuthContext on sign-out.
 */
export function stopAllSyncs() {
  for (const entry of registry.values()) {
    entry.stop()
  }
}

/**
 * Clear all registered caches.
 * Call in AuthContext on sign-out.
 */
export async function clearAllCaches() {
  await Promise.all(
    [...registry.values()].map(entry => entry.clear())
  )
}

// ─────────────────────────────────────────
// Wire each sync's state changes into the unified recalc
// ─────────────────────────────────────────

/**
 * Internal — called after registry is populated.
 * Subscribes to every registered sync's state and recalculates
 * unified state on any change.
 */
function wireStateListeners() {
  for (const entry of registry.values()) {
    entry.subscribe(() => recalcUnifiedState())
  }
}

// ─────────────────────────────────────────
// Registrations
// Add one line here per new sync module.
// ─────────────────────────────────────────

registerSync('po', {
  start:     startSync,
  stop:      stopSync,
  clear:     clearCache,
  getState:  getSyncState,
  subscribe: subscribeSyncState,
})

registerSync('mo', {
  start:     startMOSync,
  stop:      stopMOSync,
  clear:     clearMOCache,
  getState:  getMOSyncState,
  subscribe: subscribeMOSyncState,
})

// Future example:
// registerSync('hr', {
//   start:     startHRSync,
//   stop:      stopHRSync,
//   clear:     clearHRCache,
//   getState:  getHRSyncState,
//   subscribe: subscribeHRSyncState,
// })

wireStateListeners()