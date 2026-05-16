// features/dashboard/components/DashboardStatCards.jsx
import { useNavigate } from 'react-router-dom'
import StatCard from '@/components/ui/StatCard'
import { S } from '@/lib/strings'
import { formatCurrency } from '@/lib/utils'

export function DashboardStatCards({ stats, role }) {
  const navigate = useNavigate()

  const pmDrafts          = stats?.pmDraftCount        ?? 0
  const ceoPending        = stats?.ceoPendingCount     ?? 0
  const financePending    = stats?.financePendingCount ?? 0
  const rejected          = stats?.rejectedCount       ?? 0
  const totalAwaitingUSD  = stats?.totalAwaitingUSD    ?? 0
  const totalAwaitingLS   = stats?.totalAwaitingLS     ?? 0

  // Format the awaiting value, showing both currencies if both are non-zero
  const awaitingDisplay = () => {
    const hasUSD = totalAwaitingUSD > 0
    const hasLS  = totalAwaitingLS  > 0
    if (hasUSD && hasLS) {
      return `${formatCurrency(totalAwaitingUSD, 'USD')} • ${formatCurrency(totalAwaitingLS, 'SYP')}`
    }
    if (hasLS) return formatCurrency(totalAwaitingLS, 'SYP')
    return formatCurrency(totalAwaitingUSD, 'USD')
  }

  // ── PM / Secretary ───────────────────────────────────────────────
  if (role === 'purchase_manager' || role === 'secretary') {
    return (
      <div className="dashboard-stat-cards">
        {role === 'purchase_manager' && (
          <StatCard
            label={S.statPmDrafts}
            value={pmDrafts}
            variant="pending"
            linkHint
            onClick={() => navigate('/po/list?status=draft')}
          />
        )}
        <StatCard
          label={S.statRejected}
          value={rejected}
          variant="rejected"
          linkHint
          onClick={() => navigate('/po/list?status=rejected')}
        />
        <StatCard
          label={S.statAwaitingValue}
          value={awaitingDisplay()}
          variant="neutral"
        />
      </div>
    )
  }

  // ── CEO ──────────────────────────────────────────────────────────
  if (role === 'ceo') {
    return (
      <div className="dashboard-stat-cards">
        <StatCard
          label={S.statCeoPending}
          value={ceoPending}
          variant="pending"
          linkHint
          onClick={() => navigate('/po/list?status=pending_ceo')}
        />
        <StatCard
          label={S.statRejected}
          value={rejected}
          variant="rejected"
          linkHint
          onClick={() => navigate('/po/list?status=rejected')}
        />
        <StatCard
          label={S.statAwaitingValue}
          value={awaitingDisplay()}
          variant="neutral"
        />
      </div>
    )
  }

  // ── Finance ──────────────────────────────────────────────────────
  if (role === 'finance') {
    return (
      <div className="dashboard-stat-cards">
        <StatCard
          label={S.statFinancePending}
          value={financePending}
          variant="accent"
          linkHint
          onClick={() => navigate('/po/list?status=approved')}
        />
        <StatCard
          label={S.statRejected}
          value={rejected}
          variant="rejected"
          linkHint
          onClick={() => navigate('/po/list?status=rejected')}
        />
        <StatCard
          label={S.statAwaitingValue}
          value={awaitingDisplay()}
          variant="neutral"
        />
      </div>
    )
  }

  return null
}