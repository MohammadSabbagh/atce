import { useLiveQuery } from 'dexie-react-hooks'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import db from '@/lib/db'
import './po-card.scss'

export default function POCard({ po, onClick }) {
  const lineItems = useLiveQuery(
    () => db.po_line_items.where('po_id').equals(po.id).toArray(),
    [po.id]
  )

  const poTags = useLiveQuery(
    () => db.po_tags.where('po_id').equals(po.id).toArray(),
    [po.id]
  )

  const departments = lineItems
    ? [...new Set(lineItems.map(i => i.department).filter(Boolean))].sort()
    : []

  const tags = poTags ? poTags.map(t => t.tag).filter(Boolean) : []

  // currency falls back to 'USD' for any PO created before the column was added
  const currency = po.currency ?? 'USD'

  return (
    <div
      className={`po-card po-card--status-${po.status}`}
      onClick={onClick}
    >
      <div className="po-card__header">
        <div className="po-card__header-right">
          <span className="po-card__number mono">{po.po_number}</span>
          <StatusBadge status={po.status} />
          {po.requires_ceo && (
            <span className="po-card__ceo-flag">CEO</span>
          )}
        </div>
        <span className="po-card__total mono">{formatCurrency(po.total, currency)}</span>
      </div>

      <div className="po-card__title">{po.title}</div>

      <div className="po-card__meta">
        <span className="po-card__date">{formatDate(po.created_at)}</span>
        {departments.length > 0 && (
          <div className="po-card__depts">
            {departments.map(dept => (
              <span key={dept} className="po-card__dept">{dept}</span>
            ))}
          </div>
        )}
        {tags.length > 0 && (
          <div className="po-card__tags-row">
            {tags.map(tag => (
              <span key={tag} className="po-card__tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}