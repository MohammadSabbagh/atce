import StatusBadge from '@/components/ui/StatusBadge';
import { S } from '@/lib/strings';
import { formatCurrency, formatDate } from '@/lib/utils';
import './MoCard.scss';

export default function MOCard({ mo, onClick }) {
  const typeLabel = mo.type === 'car' ? S.assetTypeCar : S.assetTypeOther;

  return (
    <div className="mo-card" onClick={onClick}>
      <div className="mo-card__top">
        <span className="mo-card__number mono">{mo.mo_number}</span>
        <StatusBadge status={mo.status} />
      </div>

      <div className="mo-card__title">{mo.title}</div>

      <div className="mo-card__bottom">
        <span className="mo-card__total mono">
          {formatCurrency(mo.item_price, mo.currency)}
        </span>

        <div className="mo-card__meta">
          {mo.type && (
            <span className={`mo-card__type-badge mo-card__type-badge--${mo.type}`}>
              {typeLabel}
            </span>
          )}
          {mo.department && (
            <span className="mo-card__dept">{mo.department}</span>
          )}
        </div>

        <span className="mo-card__date">{formatDate(mo.created_at)}</span>
      </div>
    </div>
  );
}