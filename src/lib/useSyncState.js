// src/lib/useSyncState.js
// Reactive hook for PO sync state.
// Combines poSync's internal state with browser online/offline + visibility events.
//
// Returns: 'offline' | 'syncing' | 'updated' | 'live' | 'idle'

import { useState, useEffect } from 'react'
import { getSyncState, subscribeSyncState, startSync, stopSync } from './poSync'
import { useAuth } from '@/context/AuthContext'

export function useSyncState() {
  const [state, setState] = useState(() => getSyncState())
  const { profile } = useAuth()

  useEffect(() => {
    // Subscribe to poSync state changes
    const unsubscribe = subscribeSyncState((next) => {
      setState(next)
    })

    const handleOffline = () => setState('offline')

    const handleOnline = () => {
      if (!profile?.id) return
      // Reset sync so startSync can run fresh.
      // Without this, syncActive stays true from the previous session
      // and startSync returns immediately doing nothing.
      stopSync()
      startSync(profile.id)
    }

    // Mobile PWA: backgrounding the app doesn't fire online/offline events.
    // The WebSocket may die silently. When the user returns, we check state
    // and only restart if we're in a clearly broken state.
    // If state is 'live' or 'updated', don't touch it — tearing down and
    // re-establishing the WebSocket on slow internet causes timeouts.
    // Supabase's realtime client has built-in reconnection. If it fails,
    // CHANNEL_ERROR will set state to 'offline', and the next visibility
    // change will catch that.
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return
      if (!profile?.id) return

      const current = getSyncState()

      if (current === 'offline' || current === 'idle') {
        stopSync()
        startSync(profile.id)
      }
      // 'live', 'updated', 'syncing' — leave alone
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibility)

    // Sync initial value
    setState(getSyncState())

    return () => {
      unsubscribe()
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [profile?.id])

  return state
}