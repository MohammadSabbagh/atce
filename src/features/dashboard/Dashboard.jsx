// features/dashboard/Dashboard.jsx
// Unified dashboard — all 4 roles (purchase_manager, secretary, ceo, finance).
// Role-aware data is handled in useDashboard + RLS.
// This component is intentionally role-agnostic in structure.

import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useDashboard } from './hooks/useDashboard'
import { LiveIndicator } from './components/LiveIndicator'
import { DashboardStatCards } from './components/DashboardStatCards'
import { SpendingChart } from './components/SpendingChart'
import { getGreeting } from '../../lib/strings'
import './Dashboard.scss'

const QUICK_ACTIONS = [
  {
    id: 'create-po',
    label: 'طلب شراء جديد',
    icon: '+',
    to: '/po/create',
    roles: ['purchase_manager', 'secretary'],
  },
  // Future: { id: 'create-hr', label: 'طلب توظيف جديد', icon: '👤', to: '/hr/requests/create', roles: ['purchase_manager'] }
]

function QuickActions({ role }) {
  const navigate = useNavigate()
  const actions = QUICK_ACTIONS.filter(a => a.roles.includes(role))
  if (!actions.length) return null

  return (
    <section className="dashboard__quick-actions">
      {actions.map(action => (
        <button
          key={action.id}
          className="quick-action-card"
          onClick={() => navigate(action.to)}
        >
          <span className="quick-action-card__icon">{action.icon}</span>
          <span className="quick-action-card__label">{action.label}</span>
        </button>
      ))}
    </section>
  )
}

export default function Dashboard() {
  const { profile } = useAuth()
  const { stats, deptSpending, loading, error } = useDashboard()

  return (
    <div className="dashboard">
      {/* ── Header ─────────────────────────────── */}
      <div className="dashboard__header">
        <div className="dashboard__greeting">
          <p className="dashboard__greeting-sub">{getGreeting()}</p>
          <h1 className="dashboard__greeting-name">
            {profile?.full_name ?? ''}
          </h1>
        </div>
        <LiveIndicator />
      </div>

      {/* ── Quick actions ───────────────────────── */}
      <QuickActions role={profile?.role} />

      {/* ── Error state ─────────────────────────── */}
      {error && (
        <div className="dashboard__error" role="alert">
          {error}
        </div>
      )}

      {/* ── Stat cards ──────────────────────────── */}
      <section className="dashboard__section">
        {loading
          ? <DashboardStatCardsSkeleton />
          : <DashboardStatCards stats={stats} role={profile?.role} />
        }
      </section>

      {/* ── Spending chart ──────────────────────── */}
      <section className="dashboard__section">
        {loading
          ? <ChartSkeleton />
          : <SpendingChart deptSpending={deptSpending} />
        }
      </section>
    </div>
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