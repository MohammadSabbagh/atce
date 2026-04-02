import { useAuth } from '@/context/AuthContext'
import PMDashboard from './PMDashboard'
import CEODashboard from './CEODashboard'

export default function Dashboard() {
  const { role } = useAuth()

  if (!role) return null

  switch (role) {
    case 'purchase_manager':
    case 'secretary':
      return <PMDashboard />
    case 'ceo':
      return <CEODashboard />
    default:
      return (
        <div style={{ padding: '2rem', color: '#fff', fontFamily: 'monospace' }}>
          <h2>Dashboard</h2>
          <p style={{ color: '#666' }}>Coming soon for {role}</p>
        </div>
      )
  }
}