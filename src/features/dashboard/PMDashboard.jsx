import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { MOCK_PURCHASE_ORDERS } from '@/lib/mockData'
import { formatCurrency, formatDate } from '@/lib/utils'
import { S, getGreeting } from '@/lib/strings'
import StatusBadge from '@/components/ui/StatusBadge'
import StatCard from '@/components/ui/StatCard'
import NavIcon from '@/components/layout/NavIcon'
import '@/styles/pm-dashboard.scss'

export default function PMDashboard() {
  const { profile, role } = useAuth()
  const navigate = useNavigate()

  const myPOs = useMemo(
    () => MOCK_PURCHASE_ORDERS.filter((po) => po.created_by === profile.id),
    [profile.id]
  )

  const stats = useMemo(() => ({
    pending:  myPOs.filter((po) => po.status === 'pending').length,
    approved: myPOs.filter((po) => po.status === 'approved').length,
  }), [myPOs])

  const recentPOs = myPOs.slice(0, 4)

  return (
    <div className="pm-dashboard">

      {/* Header */}
      <div className="pm-dashboard__header">
        <div>
          <p className="pm-dashboard__greeting">{getGreeting()}</p>
          <h1 className="pm-dashboard__name">{profile.full_name}</h1>
        </div>
        <div className="pm-dashboard__role-badge">{S.roles[role]}</div>
      </div>

      {/* Stat cards */}
      <div className="pm-dashboard__stats">
        <StatCard
          label={S.stats.pending}
          value={stats.pending}
          variant="pending"
          icon={<NavIcon name="clock" size={18} />}
        />
        <StatCard
          label={S.stats.approved}
          value={stats.approved}
          variant="approved"
          icon={<NavIcon name="check-circle" size={18} />}
        />
      </div>

      {/* Quick create CTA */}
      <button className="pm-dashboard__cta" onClick={() => navigate('/po/create')}>
        <div className="pm-dashboard__cta-left">
          <div className="pm-dashboard__cta-icon">
            <NavIcon name="plus" size={20} />
          </div>
          <div>
            <p className="pm-dashboard__cta-title">{S.dashboard.newPO}</p>
            <p className="pm-dashboard__cta-hint">{S.dashboard.newPOHint}</p>
          </div>
        </div>
        <NavIcon name="chevron-left" size={16} />
      </button>

      {/* Recent orders */}
      <div className="pm-dashboard__section">
        <div className="pm-dashboard__section-header">
          <h2 className="pm-dashboard__section-title">{S.dashboard.recentOrders}</h2>
          <button className="pm-dashboard__section-link" onClick={() => navigate('/po/list')}>
            {S.dashboard.viewAll}
          </button>
        </div>

        {recentPOs.length === 0 ? (
          <div className="pm-dashboard__empty">
            <p>{S.dashboard.noOrders}</p>
            <span>{S.dashboard.noOrdersHint}</span>
          </div>
        ) : (
          <div className="pm-dashboard__recent">
            {recentPOs.map((po) => (
              <div key={po.id} className="recent-po" onClick={() => navigate(`/po/${po.id}`)}>
                <div className="recent-po__left">
                  <span className="recent-po__number mono">{po.po_number}</span>
                  <StatusBadge status={po.status} />
                </div>
                <div className="recent-po__center">
                  <p className="recent-po__title">{po.title}</p>
                  <p className="recent-po__meta">
                    {S.departments[po.department] ?? po.department} · {formatDate(po.date)}
                  </p>
                </div>
                <span className="recent-po__total mono">{formatCurrency(po.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}