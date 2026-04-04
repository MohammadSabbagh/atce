import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { S } from '@/lib/strings'
import StatusBadge from '@/components/ui/StatusBadge'
import Tag from '@/components/ui/Tag'
import NavIcon from '@/components/layout/NavIcon'
import { formatCurrency, formatDate } from '@/lib/utils'
import '@/styles/po-card.scss'

export default function POCard({ po, isExpanded, onToggle }) {
  const { role } = useAuth()
  const navigate = useNavigate()

  const handleViewDetails = (e) => {
    e.stopPropagation()
    navigate(`/po/${po.id}`)
  }

  return (
    <div className={`po-card ${isExpanded ? 'po-card--expanded' : ''}`}>

      {/* Header row */}
      <div className="po-card__header" onClick={onToggle}>
        <div className="po-card__header-left">
          <span className="po-card__number mono">{po.po_number}</span>
          <StatusBadge status={po.status} />
          {po.requires_ceo && (
            <span className="po-card__ceo-flag">CEO</span>
          )}
        </div>
        <div className="po-card__chevron">
          <NavIcon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} />
        </div>
      </div>

      <div className="po-card__title" onClick={onToggle}>{po.title}</div>

      <div className="po-card__meta" onClick={onToggle}>
        <span className="po-card__dept">{po.department}</span>
        <span className="po-card__date">{formatDate(po.date)}</span>
        <span className="po-card__total mono">{formatCurrency(po.total)}</span>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="po-card__body">
          {po.description && (
            <p className="po-card__description po-card__description--trimmed">
              {po.description}
            </p>
          )}

          {/* Line items */}
          <div className="po-card__section">
            <h4 className="po-card__section-title">{S.lineItems}</h4>
            <div className="po-card__items">
              {po.line_items.map((item) => (
                <div key={item.id} className="po-card__item">
                  <span className="po-card__item-desc">{item.description}</span>
                  <span className="po-card__item-price mono">{formatCurrency(item.price)}</span>
                </div>
              ))}
              <div className="po-card__item po-card__item--total">
                <span>{S.total}</span>
                <span className="mono">{formatCurrency(po.total)}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {po.tags?.length > 0 && (
            <div className="po-card__section">
              <h4 className="po-card__section-title">{S.tags}</h4>
              <div className="po-card__tags">
                {po.tags.map((tag) => (
                  <Tag key={tag} label={tag} />
                ))}
              </div>
            </div>
          )}

          {/* View full details */}
          <button className="po-card__view-details" onClick={handleViewDetails}>
            {S.viewDetails}
            <NavIcon name="arrow-left" size={14} />
          </button>
        </div>
      )}
    </div>
  )
}