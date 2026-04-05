import { useNavigate } from 'react-router-dom'
import { S } from '@/lib/strings'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import '@/styles/po-card.scss'

export default function POCard({ po }) {
  const navigate = useNavigate()

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
        <span className="po-card__dept">{po.department}</span>
        <span className="po-card__date">{formatDate(po.date)}</span>
      </div>

    </div>
  )
}