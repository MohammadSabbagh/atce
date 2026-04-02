import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MOCK_PURCHASE_ORDERS, MOCK_EMPLOYMENT_REQUESTS } from '@/lib/mockData'
import { formatCurrency } from '@/lib/utils'
import { S, getGreeting } from '@/lib/strings'
import StatusBadge from '@/components/ui/StatusBadge'
import StatCard from '@/components/ui/StatCard'
import NavIcon from '@/components/layout/NavIcon'
import { useAuth } from '@/context/AuthContext'
import '@/styles/ceo-dashboard.scss'

export default function CEODashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const pendingPOs = useMemo(
    () => MOCK_PURCHASE_ORDERS.filter((po) => po.requires_ceo && po.status === 'pending'),
    []
  )

  const pendingTotal = useMemo(
    () => pendingPOs.reduce((sum, po) => sum + po.total, 0),
    [pendingPOs]
  )

  const deptBreakdown = useMemo(() => {
    const map = {}
    MOCK_PURCHASE_ORDERS.filter((po) => po.requires_ceo).forEach((po) => {
      map[po.department] = (map[po.department] || 0) + po.total
    })
    const max = Math.max(...Object.values(map))
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([dept, total]) => ({ dept, total, pct: Math.round((total / max) * 100) }))
  }, [])

  const fulfilledERs = useMemo(
    () => MOCK_EMPLOYMENT_REQUESTS.filter((er) => er.status === 'fulfilled'),
    []
  )

  return (
    <div className="ceo-dashboard">

      {/* Header */}
      <div className="ceo-dashboard__header">
        <div>
          <p className="ceo-dashboard__greeting">{getGreeting()}</p>
          <h1 className="ceo-dashboard__name">{profile.full_name}</h1>
        </div>
        <div className="ceo-dashboard__role-badge">{S.roles.ceo}</div>
      </div>

      {/* PO Approvals */}
      <div className="ceo-dashboard__section">
        <div className="ceo-dashboard__section-header">
          <h2 className="ceo-dashboard__section-title">{S.dashboard.poApprovals}</h2>
          <button className="ceo-dashboard__section-link" onClick={() => navigate('/po/approvals')}>
            {S.dashboard.reviewAll}
          </button>
        </div>

        <div className="ceo-dashboard__po-stats">
          <StatCard
            label={S.stats.awaitingApproval}
            value={pendingPOs.length}
            variant="pending"
            icon={<NavIcon name="clock" size={18} />}
            onClick={() => navigate('/po/approvals')}
            linkHint
          />
          <StatCard
            label={S.stats.pendingValue}
            value={formatCurrency(pendingTotal)}
            variant="accent"
            icon={<NavIcon name="activity" size={18} />}
          />
        </div>
      </div>

      {/* Department breakdown */}
      {deptBreakdown.length > 0 && (
        <div className="ceo-dashboard__section">
          <h2 className="ceo-dashboard__section-title">{S.dashboard.byDepartment}</h2>
          <div className="ceo-dashboard__dept-bars">
            {deptBreakdown.map(({ dept, total, pct }) => (
              <div key={dept} className="dept-bar">
                <div className="dept-bar__header">
                  <span className="dept-bar__name">{S.departments[dept] ?? dept}</span>
                  <span className="dept-bar__value mono">{formatCurrency(total)}</span>
                </div>
                <div className="dept-bar__track">
                  <div className="dept-bar__fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending PO list */}
      {pendingPOs.length > 0 && (
        <div className="ceo-dashboard__section">
          <div className="ceo-dashboard__po-list">
            {pendingPOs.map((po) => (
              <div key={po.id} className="er-card er-card--po" onClick={() => navigate(`/po/${po.id}`)}>
                <div className="er-card__header">
                  <span className="er-card__number mono">{po.po_number}</span>
                  <StatusBadge status={po.status} />
                  <span className="er-card__ceo-flag">{S.roles.ceo}</span>
                </div>
                <p className="er-card__title">{po.title}</p>
                <div className="er-card__meta">
                  <span className="er-card__dept">{S.departments[po.department] ?? po.department}</span>
                  <span className="er-card__salary mono">{formatCurrency(po.total)}</span>
                </div>
                {po.tags?.length > 0 && (
                  <div className="er-card__tags">
                    {po.tags.map((tag) => (
                      <span key={tag} className="er-card__tag">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="er-card__actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="er-card__action-btn er-card__action-btn--reject"
                    onClick={() => alert(`Reject ${po.po_number}`)}
                  >
                    {S.po.reject}
                  </button>
                  <button
                    className="er-card__action-btn er-card__action-btn--approve"
                    onClick={() => alert(`Approve ${po.po_number}`)}
                  >
                    {S.po.approve}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fulfilled HR requests */}
      <div className="ceo-dashboard__section">
        <div className="ceo-dashboard__section-header">
          <h2 className="ceo-dashboard__section-title">{S.dashboard.hireRequests}</h2>
          <button className="ceo-dashboard__section-link" onClick={() => navigate('/hr/approvals')}>
            {S.dashboard.viewAll}
          </button>
        </div>

        {fulfilledERs.length === 0 ? (
          <div className="ceo-dashboard__empty">{S.dashboard.noFulfilledERs}</div>
        ) : (
          <div className="ceo-dashboard__er-list">
            {fulfilledERs.map((er) => (
              <div key={er.id} className="er-card">
                <div className="er-card__header">
                  <span className="er-card__number mono">{er.er_number}</span>
                  <StatusBadge status={er.status} />
                </div>
                <p className="er-card__title">{er.job_title}</p>
                <div className="er-card__meta">
                  <span className="er-card__dept">{S.departments[er.department] ?? er.department}</span>
                  {er.positions_count > 1 && (
                    <span className="er-card__positions">{er.positions_count} {S.hr.positions}</span>
                  )}
                  {er.salary_min && er.salary_max && (
                    <span className="er-card__salary mono">
                      {formatCurrency(er.salary_min)}–{formatCurrency(er.salary_max)}
                    </span>
                  )}
                </div>
                <button className="er-card__action" onClick={() => navigate('/hr/approvals')}>
                  {S.actions.review} <NavIcon name="chevron-left" size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}