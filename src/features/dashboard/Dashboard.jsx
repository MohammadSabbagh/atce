// features/dashboard/Dashboard.jsx
// Unified dashboard — all 4 roles (purchase_manager, secretary, ceo, finance).
// Role-aware data is handled in useDashboard + RLS.
// This component is intentionally role-agnostic in structure.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { useDashboard } from './hooks/useDashboard'
import { LiveIndicator } from '@/features/sync/LiveIndicator'
import { DashboardStatCards } from './components/DashboardStatCards'
import { SpendingChart } from './components/SpendingChart'
import './Dashboard.scss'
import { PersonIcon, CubeIcon } from '@radix-ui/react-icons'
import { S, getGreeting } from '@/lib/strings'
import QuickActionCard from './components/QuickActionCard'

const QUICK_ACTIONS = [
  {
    id: 'team-list',
    label: S.quickActionTeamLabel,
    subtitle: S.quickActionTeamSubtitle,
    icon: PersonIcon,
    to: '/team',
    roles: ['purchase_manager', 'secretary'],
  },
  {
    id: 'asset-list',
    label: S.quickActionAssetsLabel,
    subtitle: S.quickActionAssetsSubtitle,
    icon: CubeIcon,
    to: '/assets',
    roles: ['purchase_manager', 'secretary'],
  },
]

function QuickActions({ role }) {
  const navigate = useNavigate()
  const actions = QUICK_ACTIONS.filter(a => a.roles.includes(role))
  if (!actions.length) return null

  return (
    <section className="dashboard__quick-actions">
      {actions.map(action => (
        <QuickActionCard
          key={action.id}
          icon={action.icon}
          label={action.label}
          subtitle={action.subtitle}
          onClick={() => navigate(action.to)}
        />
      ))}
    </section>
  )
}

function getInitials(fullName) {
  if (!fullName) return '؟'
  const trimmed = fullName.trim()
  return trimmed.charAt(0)
}

function getRoleLabel(role) {
  const map = {
    purchase_manager: S.rolePurchaseManager,
    secretary:        S.roleSecretary,
    ceo:              S.roleCeo,
    finance:          S.roleFinance,
    hr:               S.roleHr,
  }
  return map[role] ?? role
}

export default function Dashboard() {
  const { profile, signOut } = useAuth()
  const { stats, deptSpending, loading, error } = useDashboard()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
    } finally {
      setSigningOut(false)
      setSheetOpen(false)
    }
  }

  return (
    <div className="dashboard">
      {/* ── Header ─────────────────────────────── */}
      <div className="dashboard__header">
        <button
          className="dashboard__avatar-btn"
          onClick={() => setSheetOpen(true)}
          aria-label={S.openUserMenu}
        >
          {getInitials(profile?.full_name)}
        </button>
        <div className="dashboard__greeting">
          <p className="dashboard__greeting-sub">{getGreeting()}</p>
          <div className="dashboard__greeting-name-row">
            <h1 className="dashboard__greeting-name">
              {profile?.full_name ?? ''}
            </h1>
          </div>
        </div>
        <LiveIndicator />
      </div>

      {/* ── Stat cards ──────────────────────────── */}
      <section className="dashboard__section">
        {loading
          ? <DashboardStatCardsSkeleton />
          : <DashboardStatCards stats={stats} role={profile?.role} />
        }
      </section>

      {/* ── Quick actions ───────────────────────── */}
      <QuickActions role={profile?.role} />

      {/* ── Error state ─────────────────────────── */}
      {error && (
        <div className="dashboard__error" role="alert">
          {error}
        </div>
      )}

      {/* ── Sign-out bottom sheet ───────────────── */}
      {sheetOpen && (
        <div
          className="dashboard__sheet-overlay"
          onClick={() => setSheetOpen(false)}
          aria-hidden="true"
        />
      )}
      <div
        className={`dashboard__sheet${sheetOpen ? ' dashboard__sheet--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={S.userMenuLabel}
      >
        <div className="dashboard__sheet-handle" />

        <div className="dashboard__sheet-profile">
          <div className="dashboard__sheet-avatar">
            {getInitials(profile?.full_name)}
          </div>
          <div className="dashboard__sheet-info">
            <span className="dashboard__sheet-name">{profile?.full_name}</span>
            <span className="dashboard__sheet-role">{getRoleLabel(profile?.role)}</span>
          </div>
        </div>

        <div className="dashboard__sheet-divider" />

        <button
          className="dashboard__sheet-signout"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          <SignOutIcon />
          {signingOut ? S.signingOut : S.signOut}
        </button>
      </div>
    </div>
  )
}

function SignOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

// ─────────────────────────────────────────
// Skeleton loaders
// ─────────────────────────────────────────
function DashboardStatCardsSkeleton() {
  return (
    <div className="dashboard-skeleton__cards">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="dashboard-skeleton__card" aria-hidden="true" />
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="dashboard-skeleton__chart" aria-hidden="true">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="dashboard-skeleton__bar-row">
          <div className="dashboard-skeleton__bar-label" />
          <div
            className="dashboard-skeleton__bar"
            style={{ width: `${85 - i * 15}%` }}
          />
          <div className="dashboard-skeleton__bar-amount" />
        </div>
      ))}
    </div>
  )
}