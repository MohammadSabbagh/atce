import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MOCK_PURCHASE_ORDERS, MOCK_EMPLOYMENT_REQUESTS } from '@/lib/mockData'
import { formatCurrency } from '@/lib/utils'
import StatusBadge from '@/components/ui/StatusBadge'
import NavIcon from '@/components/layout/NavIcon'
import { useAuth } from '@/context/AuthContext'
import '@/styles/ceo-dashboard.scss'

export default function CEODashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  // ── PO stats ─────────────────────────────────
  const pendingPOs = useMemo(
    () => MOCK_PURCHASE_ORDERS.filter(
      (po) => po.requires_ceo && po.status === 'pending'
    ),
    []
  )

  const pendingTotal = useMemo(
    () => pendingPOs.reduce((sum, po) => sum + po.total, 0),
    [pendingPOs]
  )

  // Department breakdown across all CEO-flagged POs
  const deptBreakdown = useMemo(() => {
    const map = {}
    MOCK_PURCHASE_ORDERS
      .filter((po) => po.requires_ceo)
      .forEach((po) => {
        map[po.department] = (map[po.department] || 0) + po.total
      })
    const max = Math.max(...Object.values(map))
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([dept, total]) => ({ dept, total, pct: Math.round((total / max) * 100) }))
  }, [])

  // ── HR fulfilled requests ─────────────────────
  const fulfilledERs = useMemo(
    () => MOCK_EMPLOYMENT_REQUESTS.filter((er) => er.status === 'fulfilled'),
    []
  )

  return (
    <div className="ceo-dashboard">
      {/* ── Header ── */}
      <div className="ceo-dashboard__header">
        <div>
          <p className="ceo-dashboard__greeting">{getGreeting()}</p>
          <h1 className="ceo-dashboard__name">{profile.full_name}</h1>
        </div>
        <div className="ceo-dashboard__role-badge">CEO</div>
      </div>

      {/* ── PO Approval stats ── */}
      <div className="ceo-dashboard__section">
        <div className="ceo-dashboard__section-header">
          <h2 className="ceo-dashboard__section-title">PO Approvals</h2>
          <button
            className="ceo-dashboard__section-link"
            onClick={() => navigate('/po/approvals')}
          >
            Review all
          </button>
        </div>

        <div className="ceo-dashboard__po-stats">
          <div
            className="ceo-stat-card ceo-stat-card--pending"
            onClick={() => navigate('/po/approvals')}
          >
            <div className="ceo-stat-card__top">
              <div className="ceo-stat-card__icon">
                <NavIcon name="clock" size={16} />
              </div>
              <NavIcon name="chevron-right" size={14} />
            </div>
            <span className="ceo-stat-card__value mono">{pendingPOs.length}</span>
            <span className="ceo-stat-card__label">Awaiting Approval</span>
          </div>

          <div className="ceo-stat-card ceo-stat-card--value">
            <div className="ceo-stat-card__top">
              <div className="ceo-stat-card__icon">
                <NavIcon name="activity" size={16} />
              </div>
            </div>
            <span className="ceo-stat-card__value mono">
              {formatCurrency(pendingTotal)}
            </span>
            <span className="ceo-stat-card__label">Pending Value</span>
          </div>
        </div>
      </div>

      {/* ── Department breakdown ── */}
      {deptBreakdown.length > 0 && (
        <div className="ceo-dashboard__section">
          <h2 className="ceo-dashboard__section-title">By Department</h2>
          <div className="ceo-dashboard__dept-bars">
            {deptBreakdown.map(({ dept, total, pct }) => (
              <div key={dept} className="dept-bar">
                <div className="dept-bar__header">
                  <span className="dept-bar__name">{dept}</span>
                  <span className="dept-bar__value mono">{formatCurrency(total)}</span>
                </div>
                <div className="dept-bar__track">
                  <div
                    className="dept-bar__fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
{/* ── Pending PO list ── */}
{pendingPOs.length > 0 && (
        <div className="ceo-dashboard__section">
          <div className="ceo-dashboard__po-list">
            {pendingPOs.map((po) => (
              <div
                key={po.id}
                className="er-card er-card--po"
                onClick={() => navigate(`/po/${po.id}`)}
              >
                <div className="er-card__header">
                  <span className="er-card__number mono">{po.po_number}</span>
                  <StatusBadge status={po.status} />
                  <span className="er-card__ceo-flag">CEO</span>
                </div>
                <p className="er-card__title">{po.title}</p>
                <div className="er-card__meta">
                  <span className="er-card__dept">{po.department}</span>
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
                    onClick={() => alert(`Reject ${po.po_number} — Phase 4`)}
                  >
                    Reject
                  </button>
                  <button
                    className="er-card__action-btn er-card__action-btn--approve"
                    onClick={() => alert(`Approve ${po.po_number} — Phase 4`)}
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Fulfilled HR requests ── */}
      <div className="ceo-dashboard__section">
        <div className="ceo-dashboard__section-header">
          <h2 className="ceo-dashboard__section-title">Hire Requests</h2>
          <button
            className="ceo-dashboard__section-link"
            onClick={() => navigate('/hr/approvals')}
          >
            View all
          </button>
        </div>

        {fulfilledERs.length === 0 ? (
          <div className="ceo-dashboard__empty">
            No fulfilled requests awaiting approval
          </div>
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
                  <span className="er-card__dept">{er.department}</span>
                  {er.positions_count > 1 && (
                    <span className="er-card__positions">
                      {er.positions_count} positions
                    </span>
                  )}
                  {er.salary_min && er.salary_max && (
                    <span className="er-card__salary mono">
                      {formatCurrency(er.salary_min)}–{formatCurrency(er.salary_max)}
                    </span>
                  )}
                </div>
                <button
                  className="er-card__action"
                  onClick={() => navigate('/hr/approvals')}
                >
                  Review <NavIcon name="chevron-right" size={12} />
                </button>
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