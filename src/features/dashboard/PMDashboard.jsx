import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { MOCK_PURCHASE_ORDERS } from '@/lib/mockData'
import { formatCurrency, formatDate } from '@/lib/utils'
import StatusBadge from '@/components/ui/StatusBadge'
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
    pending: myPOs.filter((po) => po.status === 'pending').length,
    approved: myPOs.filter((po) => po.status === 'approved').length,
  }), [myPOs])

  const recentPOs = myPOs.slice(0, 4)

  const greeting = getGreeting()

  return (
    <div className="pm-dashboard">
      {/* ── Header ── */}
      <div className="pm-dashboard__header">
        <div>
          <p className="pm-dashboard__greeting">{greeting}</p>
          <h1 className="pm-dashboard__name">{profile.full_name}</h1>
        </div>
        <div className="pm-dashboard__role-badge">
          {role === 'secretary' ? 'Secretary' : 'Purchase Mgr'}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="pm-dashboard__stats">
        <div className="stat-card stat-card--pending">
          <div className="stat-card__icon">
            <NavIcon name="clock" size={18} />
          </div>
          <div className="stat-card__body">
            <span className="stat-card__value mono">{stats.pending}</span>
            <span className="stat-card__label">Pending</span>
          </div>
        </div>

        <div className="stat-card stat-card--approved">
          <div className="stat-card__icon">
            <NavIcon name="check-circle" size={18} />
          </div>
          <div className="stat-card__body">
            <span className="stat-card__value mono">{stats.approved}</span>
            <span className="stat-card__label">Approved</span>
          </div>
        </div>
      </div>

      {/* ── Quick create CTA ── */}
      <button
        className="pm-dashboard__cta"
        onClick={() => navigate('/po/create')}
      >
        <div className="pm-dashboard__cta-left">
          <div className="pm-dashboard__cta-icon">
            <NavIcon name="plus" size={20} />
          </div>
          <div>
            <p className="pm-dashboard__cta-title">New Purchase Order</p>
            <p className="pm-dashboard__cta-hint">Fill in details, add items, submit</p>
          </div>
        </div>
        <NavIcon name="chevron-right" size={16} />
      </button>

      {/* ── Recent activity ── */}
      <div className="pm-dashboard__section">
        <div className="pm-dashboard__section-header">
          <h2 className="pm-dashboard__section-title">Recent Orders</h2>
          <button
            className="pm-dashboard__section-link"
            onClick={() => navigate('/po/list')}
          >
            View all
          </button>
        </div>

        {recentPOs.length === 0 ? (
          <div className="pm-dashboard__empty">
            <p>No purchase orders yet</p>
            <span>Create your first PO above</span>
          </div>
        ) : (
          <div className="pm-dashboard__recent">
            {recentPOs.map((po) => (
              <div key={po.id} className="recent-po">
                <div className="recent-po__left">
                  <span className="recent-po__number mono">{po.po_number}</span>
                  <StatusBadge status={po.status} />
                </div>
                <div className="recent-po__center">
                  <p className="recent-po__title">{po.title}</p>
                  <p className="recent-po__meta">
                    {po.department} · {formatDate(po.date)}
                  </p>
                </div>
                <span className="recent-po__total mono">
                  {formatCurrency(po.total)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning,'
  if (h < 17) return 'Good afternoon,'
  return 'Good evening,'
}