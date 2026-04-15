import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { S } from '@/lib/strings'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import db from '@/lib/db'
import '@/styles/po-card.scss'

export default function POCard({ po }) {
  const navigate = useNavigate()

  // Fetch departments for this PO's line items from Dexie.
  // useLiveQuery re-renders if line items change (future-proofing).
  const lineItems = useLiveQuery(
    () => db.po_line_items.where('po_id').equals(po.id).toArray(),
    [po.id]
  )

  const departments = lineItems
    ? [...new Set(lineItems.map(i => i.department).filter(Boolean))].sort()
    : []

  return (
    <div className="po-card" onClick={() => navigate(`/po/${po.id}`)}>

      <div className="po-card__header">
        <div className="po-card__header-left">
          <span className="po-card__number mono">{po.po_number}</span>
          <StatusBadge status={po.status} />
          {po.requires_ceo && (
            <span className="po-card__ceo-flag">CEO</span>
          )}
        </div>
        <span className="po-card__total mono">{formatCurrency(po.total)}</span>
      </div>

      <div className="po-card__title">{po.title}</div>

      <div className="po-card__meta">
        <div className="po-card__depts">
          {departments.map(dept => (
            <span key={dept} className="po-card__dept">{dept}</span>
          ))}
        </div>
        <span className="po-card__date">{formatDate(po.date)}</span>
      </div>

    </div>
  )
}