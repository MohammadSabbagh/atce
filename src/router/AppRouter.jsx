import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ROLE_HOME } from './roleRoutes'
import RootLayout from '@/components/layout/RootLayout'
import POList from '@/features/po/POList'
import CreatePO from '@/features/po/create/CreatePO'
import Dashboard from '@/features/dashboard/Dashboard'
import FinanceDashboard from '../features/finance/FinanceDashboard';
import PODetail from '../features/po/PODetail'
import CEOApprovalQueue from '@/features/po/CEOApprovalQueue'



// Placeholder screens — replace with real components in Phase 2/3
const Placeholder = ({ name }) => (
  <div style={{ padding: '2rem', color: '#fff', fontFamily: 'monospace' }}>
    <h2>{name}</h2>
    <p style={{ color: '#666' }}>Coming soon</p>
  </div>
)

export default function AppRouter() {
  const { role } = useAuth()

  if (!role) return <Navigate to="/login" replace />

  const home = ROLE_HOME[role]

  return (
    <Routes>
      <Route element={<RootLayout />}>
        {/* Shared */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* PO Module */}
        <Route path="/po/list" element={<POList />} />
        <Route path="/po/create" element={<CreatePO />} />
        <Route path="/po/:id" element={<PODetail />} />
        <Route path="/po/approvals" element={<CEOApprovalQueue />} />

        {/* HR Module */}
        <Route path="/hr/dashboard" element={<Placeholder name="HR Dashboard" />} />
        <Route path="/hr/employees" element={<Placeholder name="Employee List" />} />
        <Route path="/hr/requests/my" element={<Placeholder name="My Hire Requests" />} />
        <Route path="/hr/requests/fulfill" element={<Placeholder name="Fulfill Requests" />} />
        <Route path="/hr/org-chart" element={<Placeholder name="Org Chart" />} />
        <Route path="/hr/approvals" element={<Placeholder name="HR Approvals" />} />

        {/* Finance */}
        <Route path="/finance/dashboard" element={<FinanceDashboard />} />

        {/* Catch-all → role home */}
        <Route path="*" element={<Navigate to={home} replace />} />
      </Route>
    </Routes>
  )
}