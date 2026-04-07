import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import DevRoleSwitcher from '@/components/dev/DevRoleSwitcher'
import { useAuth } from '@/context/AuthContext'
import { startSync, stopSync } from '@/lib/poSync'
import '@/styles/layout.scss'

export default function RootLayout() {
  const { isDev, profile } = useAuth()

  // Start PO cache sync when authenticated shell mounts.
  // Auth is guaranteed here — RootLayout is inside ProtectedRoute.
  useEffect(() => {
    if (profile?.id) {
      startSync(profile.id)
    }
    return () => stopSync()
  }, [profile?.id])

  return (
    <div className="app-shell">
      <main className="app-main">
        <Outlet />
      </main>
      <BottomNav />
      {isDev && <DevRoleSwitcher />}
    </div>
  )
}