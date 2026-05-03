import { ChevronLeftIcon } from '@radix-ui/react-icons'

export default function QuickActionCard({ icon: Icon, label, subtitle, onClick }) {
  return (
    <button type="button" className="quick-action-card" onClick={onClick}>
      <span className="quick-action-card__icon-wrap">
        <Icon className="quick-action-card__icon" width={20} height={20} />
      </span>

      <span className="quick-action-card__text">
        <span className="quick-action-card__label">{label}</span>
        {subtitle && (
          <span className="quick-action-card__subtitle">{subtitle}</span>
        )}
      </span>

      <ChevronLeftIcon
        className="quick-action-card__chevron"
        width={18}
        height={18}
      />
    </button>
  )
}