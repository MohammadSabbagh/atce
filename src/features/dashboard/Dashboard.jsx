// features/dashboard/Dashboard.jsx
// Unified dashboard — all 4 roles (purchase_manager, secretary, ceo, finance).
// Role-aware data is handled in useDashboard + RLS.
// This component is intentionally role-agnostic in structure.

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



      {/* ── Spending chart ──────────────────────── */}
      {/* <section className="dashboard__section">
        {loading
          ? <ChartSkeleton />
          : <SpendingChart deptSpending={deptSpending} />
        }
      </section> */}
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