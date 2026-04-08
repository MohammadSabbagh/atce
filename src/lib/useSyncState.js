// src/lib/useSyncState.js
// Reactive hook for PO sync state.
// Combines poSync's internal state with browser online/offline detection.
//
// Returns: 'offline' | 'syncing' | 'updated' | 'live' | 'idle'

import { useState, useEffect } from 'react'
import { getSyncState, subscribeSyncState, startSync } from './poSync'
import { useAuth } from '@/context/AuthContext'

export function useSyncState() {
  const [state, setState] = useState(() => {
    // Initial value: check network first, then poSync state
    if (!navigator.onLine) return 'offline'
    return getSyncState()
  })

  const { profile } = useAuth()

  useEffect(() => {
    // Subscribe to poSync state changes
    const unsubscribe = subscribeSyncState((next) => {
      setState(next)
    })

    // Override with offline when browser loses connection
    const handleOffline = () => setState('offline')

    const handleOnline = () => {
      // Went back online — kick off a re-sync if we have a user
      setState('syncing')
      if (profile?.id) {
        startSync(profile.id)
      }
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    // Sync initial value (poSync may have advanced since useState init)
    const current = navigator.onLine ? getSyncState() : 'offline'
    setState(current)

    return () => {
      unsubscribe()
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [profile?.id])

  return state
}