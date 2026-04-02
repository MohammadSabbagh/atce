import { useFinancePOs } from './hooks/useFinancePOs'
import { S } from '@/lib/strings'
import StatCard from '@/components/ui/StatCard'
import NavIcon from '@/components/layout/NavIcon'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import '@/styles/finance-dashboard.scss'

const STATUS_FILTERS = [
  { value: 'all',      label: S.filters.all },
  { value: 'pending',  label: S.status.pending },
  { value: 'approved', label: S.status.approved },
  { value: 'rejected', label: S.status.rejected },
]

export default function FinanceDashboard() {
  const {
    pos, isLive, lastUpdate,
    statusFilter, setStatusFilter,
    deptFilter, setDeptFilter,
    stats, deptBreakdown, maxDeptValue, departments,
  } = useFinancePOs()

  const fmtTime = (date) =>
    date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="finance-dashboard">

      {/* Header */}
      <div className="finance-dashboard__header">
        <div className="finance-dashboard__header-left">
          <h1 className="finance-dashboard__title">{S.dashboard.financeTitle}</h1>
          <span className="finance-dashboard__subtitle">
            {S.finance.readOnly} · {S.finance.allDepts}
          </span>
        </div>
        <div className="finance-live-chip">
          <span className="finance-live-chip__dot" />
          {S.finance.live}
        </div>
      </div>

      <div className="finance-dashboard__content">

        {/* Last updated */}
        <div className="finance-dashboard__update-bar">
          <span className="finance-dashboard__update-dot" />
          {S.dashboard.updatedAt} {fmtTime(lastUpdate)}
        </div>

        {/* Stat cards */}
        <div className="finance-dashboard__stats">
          <StatCard
            label={S.stats.totalOrders}
            value={stats.totalCount}
            variant="neutral"
            icon={<NavIcon name="list" size={18} />}
          />
          <StatCard
            label={S.stats.totalValue}
            value={formatCurrency(stats.totalValue)}
            variant="accent"
            icon={<NavIcon name="activity" size={18} />}
          />
          <StatCard
            label={S.stats.approved}
            value={formatCurrency(stats.approvedValue)}
            variant="approved"
            icon={<NavIcon name="check-circle" size={18} />}
          />
          <StatCard
            label={S.stats.pending}
            value={formatCurrency(stats.pendingValue)}
            variant="pending"
            icon={<NavIcon name="clock" size={18} />}
          />
        </div>

        {/* Department breakdown */}
        <div className="finance-dashboard__dept-section">
          <div className="finance-dashboard__section-header">
            <span className="finance-dashboard__section-title">{S.dashboard.byDepartment}</span>
            <span className="finance-dashboard__section-count">
              {deptBreakdown.length} {S.finance.active}
            </span>
          </div>
          {deptBreakdown.map((d) => {
            const fillPct = maxDeptValue > 0 ? (d.value / maxDeptValue) * 100 : 0
            const approvedPct = d.value > 0 ? (d.approved / d.value) * 100 : 0
            return (
              <div key={d.dept} className="finance-dept-row">
                <div className="finance-dept-row__meta">
                  <span className="finance-dept-row__name">{S.departments[d.dept] ?? d.dept}</span>
                  <span className="finance-dept-row__total mono">{formatCurrency(d.value)}</span>
                </div>
                <div className="finance-dept-row__track">
                  <div className="finance-dept-row__fill" style={{ width: `${fillPct}%` }} />
                  <div
                    className="finance-dept-row__approved"
                    style={{ width: `${fillPct * (approvedPct / 100)}%` }}
                  />
                </div>
                <span className="finance-dept-row__count">
                  {d.count} طلب
                </span>
              </div>
            )
          })}
        </div>

        {/* Filters + PO list */}
        <div>
          <div className="finance-dashboard__section-header">
            <span className="finance-dashboard__section-title">{S.nav.allOrders}</span>
            <span className="finance-dashboard__section-count">
              {pos.length} {S.finance.ordersShown}
            </span>
          </div>

          <div className="finance-dashboard__filters">
            <div className="finance-dashboard__filter-row">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  className={`finance-chip${statusFilter === f.value ? ` finance-chip--active finance-chip--${f.value}` : ''}`}
                  onClick={() => setStatusFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="finance-dashboard__filter-row">
              <button
                className={`finance-chip${deptFilter === 'all' ? ' finance-chip--active' : ''}`}
                onClick={() => setDeptFilter('all')}
              >
                {S.filters.allDepts}
              </button>
              {departments.map((d) => (
                <button
                  key={d}
                  className={`finance-chip${deptFilter === d ? ' finance-chip--active' : ''}`}
                  onClick={() => setDeptFilter(d)}
                >
                  {S.departments[d] ?? d}
                </button>
              ))}
            </div>
          </div>

          <div className="finance-dashboard__po-list">
            {pos.length === 0 ? (
              <div className="finance-dashboard__empty">{S.actions.error}</div>
            ) : (
              pos.map((po) => (
                <div key={po.id} className={`finance-po-card finance-po-card--${po.status}`}>
                  <div className="finance-po-card__top">
                    <div className="finance-po-card__left">
                      <span className="finance-po-card__number mono">{po.po_number}</span>
                      <span className="finance-po-card__title">{po.title}</span>
                    </div>
                    <StatusBadge status={po.status} />
                  </div>
                  <div className="finance-po-card__meta">
                    <span>{S.departments[po.department] ?? po.department}</span>
                    <span className="finance-po-card__dot" />
                    <span>{formatDate(po.date)}</span>
                    {po.creator?.full_name && (
                      <>
                        <span className="finance-po-card__dot" />
                        <span>{po.creator.full_name}</span>
                      </>
                    )}
                    <span className="finance-po-card__total mono">{formatCurrency(po.total)}</span>
                  </div>
                  {(po.tags?.length > 0 || po.requires_ceo) && (
                    <div className="finance-po-card__tags">
                      {po.requires_ceo && (
                        <span className="finance-po-card__ceo-flag">{S.roles.ceo}</span>
                      )}
                      {po.tags?.map((t) => (
                        <span key={t.tag ?? t} className="finance-po-card__tag">
                          #{t.tag ?? t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}