// features/dashboard/components/DashboardStatCards.jsx
import { useNavigate } from 'react-router-dom'
import StatCard from '@/components/ui/StatCard'
import { S, formatCurrency } from '@/lib/strings'

export function DashboardStatCards({ stats }) {
  const navigate = useNavigate()

  const ceoPending     = stats?.ceoPendingCount     ?? 0
  const financePending = stats?.financePendingCount ?? 0
  const rejected       = stats?.rejectedCount       ?? 0
  const awaitingValue  = stats?.totalAwaitingValue  ?? 0

  return (
    <div className="dashboard-stat-cards">
      <StatCard
        label={S.statCeoPending}
        value={ceoPending}
        variant="pending"
        linkHint
        onClick={() => navigate('/po/list?filter=ceo_pending')}
      />
      <StatCard
        label={S.statFinancePending}
        value={financePending}
        variant="accent"
        linkHint
        onClick={() => navigate('/po/list?filter=finance_pending')}
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
        value={formatCurrency(awaitingValue)}
        variant="neutral"
        linkHint
        onClick={() => navigate('/po/list?status=pending')}
      />
    </div>
  )
}