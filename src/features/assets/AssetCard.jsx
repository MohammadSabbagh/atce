import { S } from '../../lib/strings';
import './AssetCard.scss';

export default function AssetCard({ asset, onClick }) {
  const imageUrl = asset.image_url
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/attachments/${asset.image_url}`
    : null;

  return (
    <div className="asset-card" onClick={onClick}>
      <div className="asset-card__image-col">
        {imageUrl ? (
          <img className="asset-card__image" src={imageUrl} alt={asset.name} />
        ) : (
          <div className="asset-card__image-placeholder">
            {asset.type === 'car' ? '🚗' : '📦'}
          </div>
        )}
      </div>

      <div className="asset-card__body">
        <div className="asset-card__top">
          <span className="asset-card__name">{asset.name}</span>
          <span className={`asset-card__status${asset.is_active ? '' : ' asset-card__status--inactive'}`}>
            {asset.is_active ? S.assetActive : S.assetInactive}
          </span>
        </div>

        <div className="asset-card__meta">
          <span className={`asset-card__type-badge asset-card__type-badge--${asset.type}`}>
            {asset.type === 'car' ? S.assetTypeCar : S.assetTypeOther}
          </span>
          <span className="asset-card__dept">{asset.department}</span>
        </div>

        <div className="asset-card__bottom">
          {asset.type === 'car' && asset.plate_number && (
            <span className="asset-card__plate">{asset.plate_number}</span>
          )}
          {asset.assigned_to && (
            <span className="asset-card__assigned">
              {S.assetAssignedTo}: {asset.assigned_to}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}