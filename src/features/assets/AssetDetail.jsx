import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { S } from '@/lib/strings';
import './AssetDetail.scss';

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAsset() {
      setLoading(true);
      const { data, error } = await supabase
        .from('assets')
        .select('*, assignee:team_members!assigned_to(id, full_name, title), provider:providers!provider_id(id, name)')
        .eq('id', id)
        .single();

      if (error) setError(error.message);
      else setAsset(data);
      setLoading(false);
    }
    fetchAsset();
  }, [id]);

  if (loading) {
    return (
      <div className="asset-detail asset-detail--loading">
        <div className="asset-detail__skeleton asset-detail__skeleton--image" />
        <div className="asset-detail__skeleton asset-detail__skeleton--title" />
        <div className="asset-detail__skeleton asset-detail__skeleton--row" />
        <div className="asset-detail__skeleton asset-detail__skeleton--row" />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="asset-detail asset-detail--error">
        <p className="asset-detail__error-msg">{S.errorGeneric}</p>
      </div>
    );
  }

  const imageUrl = asset.image_url
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/attachments/${asset.image_url}`
    : null;

  return (
    <div className="asset-detail">
      <div className="asset-detail__topbar">
        <button className="asset-detail__back" onClick={() => navigate(-1)}>
          {S.back}
        </button>
        <button
          className="asset-detail__edit-btn"
          onClick={() => navigate(`/assets/${id}/edit`)}
        >
          {S.edit}
        </button>
      </div>

      {imageUrl ? (
        <img className="asset-detail__image" src={imageUrl} alt={asset.name} />
      ) : (
        <div className="asset-detail__image-placeholder">
          {asset.type === 'car' ? '🚗' : '📦'}
        </div>
      )}

      <div className="asset-detail__content">
        <div className="asset-detail__name-row">
          <h1 className="asset-detail__name">{asset.name}</h1>
          <span className={`asset-detail__status${asset.is_active ? '' : ' asset-detail__status--inactive'}`}>
            {asset.is_active ? S.assetActive : S.assetInactive}
          </span>
        </div>

        <div className="asset-detail__badges">
          <span className={`asset-detail__type-badge asset-detail__type-badge--${asset.type}`}>
            {asset.type === 'car' ? S.assetTypeCar : S.assetTypeOther}
          </span>
          <span className="asset-detail__dept">{asset.department}</span>
        </div>

        <div className="asset-detail__section">
          <h2 className="asset-detail__section-title">{S.assetInfoSection}</h2>

          <div className="asset-detail__fields">
            {asset.serial_number && (
              <DetailRow label={S.assetSerialNumber} value={asset.serial_number} mono />
            )}
            {asset.assignee?.full_name && (
              <DetailRow label={S.assetAssignedTo} value={asset.assignee.full_name} />
            )}
            {asset.provider?.name && (
              <button
                type="button"
                className="asset-detail__field-row asset-detail__field-row--link"
                onClick={() => navigate(`/providers/${asset.provider.id}`)}
              >
                <span className="asset-detail__field-label">{S.providerLabel}</span>
                <span className="asset-detail__field-value">
                  {asset.provider.name} ↗
                </span>
              </button>
            )}
            {asset.source_po_number && (
              <DetailRow label={S.assetSourcePO} value={asset.source_po_number} mono />
            )}
            {asset.type === 'car' && (
              <>
                {asset.plate_number && (
                  <DetailRow label={S.assetPlateNumber} value={asset.plate_number} mono />
                )}
                {asset.model && (
                  <DetailRow label={S.assetModel} value={asset.model} />
                )}
              </>
            )}
            {asset.notes && (
              <div className="asset-detail__notes">
                <span className="asset-detail__field-label">{S.assetNotes}</span>
                <p className="asset-detail__notes-text">{asset.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }) {
  return (
    <div className="asset-detail__field-row">
      <span className="asset-detail__field-label">{label}</span>
      <span className={`asset-detail__field-value${mono ? ' asset-detail__field-value--mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}