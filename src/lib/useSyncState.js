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
    // The WebSocket dies silently. When the user returns, we need to
    // check if we're still connected and restart sync if needed.
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return
      if (!profile?.id) return

      const current = getSyncState()

      // If we were live but the channel probably died while backgrounded,
      // or if we're in offline/idle state, try to re-sync.
      if (current === 'offline' || current === 'idle') {
        stopSync()
        startSync(profile.id)
      } else if (current === 'live' || current === 'updated') {
        // Channel might have died while backgrounded — restart to be safe.
        // startSync will set syncing → updated → live quickly if server is reachable.
        stopSync()
        startSync(profile.id)
      }
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