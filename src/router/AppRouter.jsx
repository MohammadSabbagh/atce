import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { ROLE_HOME } from './roleRoutes'
import RootLayout from '@/components/layout/RootLayout'
import LoginScreen from '@/features/auth/LoginScreen'
import POList from '@/features/po/POList'
import CreatePO from '@/features/po/create/CreatePO'
import Dashboard from '@/features/dashboard/Dashboard'
import PODetail from '../features/po/PODetail'

import AssetsPage from '../features/assets/AssetsPage';
import AssetDetail from '../features/assets/AssetDetail';
import AssetForm from '../features/assets/AssetForm';

import MOList   from '../features/mo/MOList';
import MOCreate from '../features/mo/MOCreate';

import PrimitivesPreview from '@/components/dev/PrimitivesPreview'

import TeamPage   from '../features/team/TeamPage';
import TeamDetail from '../features/team/TeamDetail';
import TeamForm   from '../features/team/TeamForm';

const Placeholder = ({ name }) => (
  <div style={{ padding: '2rem', color: '#fff', fontFamily: 'monospace' }}>
    <h2>{name}</h2>
    <p style={{ color: '#666' }}>Coming soon</p>
  </div>
)

const AppSplash = () => (
  <div style={{
    position: 'fixed',
    inset: 0,
    background: '#06080D',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <div style={{
      width: 32,
      height: 32,
      border: '2px solid #1e2535',
      borderTopColor: '#4f8ef7',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
)

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <AppSplash />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

export default function AppRouter() {
  const { role, loading, isAuthenticated } = useAuth()

  if (loading) return <AppSplash />

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to={ROLE_HOME[role]} replace />
            : <LoginScreen />
        }
      />

      {/* Protected */}
      <Route
        element={
          <ProtectedRoute>
            <RootLayout />
          </ProtectedRoute>
        }
      >
        {/* Unified dashboard — all roles */}
        <Route path="/dashboard"          element={<Dashboard />} />
        <Route path="/finance/dashboard"  element={<Navigate to="/dashboard" replace />} />

        <Route path="/po/list"   element={<POList />} />
        <Route path="/po/create" element={<CreatePO />} />
        <Route path="/po/:id"    element={<PODetail />} />

        {/* HR — placeholders until HR module is built */}
        <Route path="/hr/dashboard"        element={<Placeholder name="HR Dashboard" />} />
        <Route path="/hr/employees"        element={<Placeholder name="Employee List" />} />
        <Route path="/hr/requests/my"      element={<Placeholder name="My Hire Requests" />} />
        <Route path="/hr/requests/fulfill" element={<Placeholder name="Fulfill Requests" />} />
        <Route path="/hr/org-chart"        element={<Placeholder name="Org Chart" />} />
        <Route path="/hr/approvals"        element={<Placeholder name="HR Approvals" />} />
        
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/assets/new" element={<AssetForm />} />
        <Route path="/assets/:id" element={<AssetDetail />} />
        <Route path="/assets/:id/edit" element={<AssetForm />} />

        <Route path="/mo"        element={<MOList />} />
        <Route path="/mo/create" element={<MOCreate />} />
        {/* <Route path="/mo/:id"    element={<MODetail />} /> */}

        <Route path="/team"          element={<TeamPage />} />
        <Route path="/team/new"      element={<TeamForm />} />
        <Route path="/team/:id"      element={<TeamDetail />} />
        <Route path="/team/:id/edit" element={<TeamForm />} />        

        {/* DEV */}
        <Route path="/dev/primitives" element={<PrimitivesPreview />} />

        <Route
          path="*"
          element={<Navigate to={role ? ROLE_HOME[role] : '/login'} replace />}
        />
      </Route>
    </Routes>
  )
}