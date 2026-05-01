import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import { useAuth } from '@/features/auth/AuthContext'
import { startAllSyncs, stopAllSyncs } from '@/lib/syncManager'

import './layout.scss'

export default function RootLayout() {
  const { profile } = useAuth()

  // Start PO cache sync when authenticated shell mounts.
  // Auth is guaranteed here — RootLayout is inside ProtectedRoute.
  useEffect(() => {
    if (profile?.id) {
      startAllSyncs(profile.id)
    }
    return () => stopAllSyncs()
  }, [profile?.id])

  return (
    <div className="app-shell">
      <main className="app-main">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}