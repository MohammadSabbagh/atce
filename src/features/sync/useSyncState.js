// src/features/sync/useSyncState.js
// Reactive hook for unified sync state across all registered syncs.
// Combines syncManager's unified state with browser online/offline + visibility events.
//
// Returns: 'offline' | 'syncing' | 'updated' | 'live' | 'idle'

import { useState, useEffect } from 'react'
import {
  getUnifiedSyncState,
  subscribeUnifiedSyncState,
  startAllSyncs,
  stopAllSyncs,
} from '@/lib/syncManager'
import { useAuth } from '@/features/auth/AuthContext'

export function useSyncState() {
  const [state, setState] = useState(() => getUnifiedSyncState())
  const { profile } = useAuth()

  useEffect(() => {
    const unsubscribe = subscribeUnifiedSyncState((next) => {
      setState(next)
    })

    const handleOffline = () => setState('offline')

    const handleOnline = () => {
      if (!profile?.id) return
      stopAllSyncs()
      startAllSyncs(profile.id)
    }

    // Mobile PWA: backgrounding the app doesn't fire online/offline events.
    // The WebSocket may die silently. When the user returns, check state
    // and only restart if clearly broken.
    // 'live' and 'updated' are left alone — Supabase realtime has built-in
    // reconnection. CHANNEL_ERROR will set state to offline if it fails,
    // and the next visibility change will catch that.
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return
      if (!profile?.id) return

      const current = getUnifiedSyncState()
      if (current === 'offline' || current === 'idle') {
        stopAllSyncs()
        startAllSyncs(profile.id)
      }
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibility)

    setState(getUnifiedSyncState())

    return () => {
      unsubscribe()
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [profile?.id])

  return state
}