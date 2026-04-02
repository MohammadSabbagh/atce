import '@/styles/stat-card.scss'

/**
 * Unified StatCard — used by all role dashboards.
 *
 * Props:
 *   label      string   — Arabic label shown below the value
 *   value      string|number
 *   variant    'pending' | 'approved' | 'rejected' | 'neutral' | 'accent'
 *   icon       ReactNode (optional)
 *   onClick    function (optional) — makes card tappable
 *   linkHint   boolean  — shows a chevron when onClick is provided
 */
export default function StatCard({ label, value, variant = 'neutral', icon, onClick, linkHint }) {
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      className={`stat-card stat-card--${variant}${onClick ? ' stat-card--tappable' : ''}`}
      onClick={onClick}
    >
      {icon && (
        <div className="stat-card__icon">{icon}</div>
      )}
      <span className="stat-card__value mono">{value}</span>
      <span className="stat-card__label">{label}</span>
      {linkHint && onClick && (
        <span className="stat-card__chevron" aria-hidden="true">‹</span>
      )}
    </Tag>
  )
}