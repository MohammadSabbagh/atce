import { useLiveQuery } from 'dexie-react-hooks'
import StatusBadge from '@/components/ui/StatusBadge'
import { S } from '@/lib/strings'
import { formatCurrency, formatDate } from '@/lib/utils'
import db from '@/lib/db'
import './MoCard.scss'
import { getAssetTypeLabel } from '@/lib/constants';

export default function MOCard({ mo, onClick }) {
  const moTags = useLiveQuery(
    () => db.mo_tags.where('mo_id').equals(mo.id).toArray(),
    [mo.id]
  )

  const tags = moTags ? moTags.map(t => t.tag).filter(Boolean) : []
  const typeLabel = mo.type === 'car' ? S.assetTypeCar : S.assetTypeOther

  // currency falls back to 'USD' for any MO created before the column was added
  const currency = mo.currency ?? 'USD'

  return (
    <div
      className={`mo-card mo-card--status-${mo.status}`}
      onClick={onClick}
    >
      <div className="mo-card__header">
        <div className="mo-card__header-right">
          <span className="mo-card__number mono">{mo.mo_number}</span>
          <StatusBadge status={mo.status} />
          {mo.requires_ceo && (
            <span className="mo-card__ceo-flag">CEO</span>
          )}
        </div>
        <span className="mo-card__total mono">{formatCurrency(mo.item_price, currency)}</span>
      </div>

      <div className="mo-card__title">{mo.title}</div>

      <div className="mo-card__meta">
        <span className="mo-card__date">{formatDate(mo.created_at)}</span>
        {mo.type && (
          <span className={`mo-card__type-badge mo-card__type-badge--${mo.type}`}>
            {getAssetTypeLabel(mo.type)}
          </span>
        )}
        {mo.department && (
          <span className="mo-card__dept">{mo.department}</span>
        )}
        {tags.length > 0 && (
          <div className="mo-card__tags-row">
            {tags.map(tag => (
              <span key={tag} className="mo-card__tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}