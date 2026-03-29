import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import DevRoleSwitcher from '@/components/dev/DevRoleSwitcher'
import { useAuth } from '@/context/AuthContext'
import '@/styles/layout.scss'

export default function RootLayout() {
  const { isDev } = useAuth()

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