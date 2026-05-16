import { useNavigate } from 'react-router-dom';
import { useProviderDetail } from './useProviderDetail';
import { S } from '@/lib/strings';
import { formatCurrency } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import './ProviderDetail.scss';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0);
  return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
}

export default function ProviderDetail() {
  const navigate = useNavigate();
  const {
    provider,
    linkedPOs,
    linkedMOs,
    linkedAssets,
    loading,
    error,
  } = useProviderDetail();

  if (loading) {
    return (
      <div className="provider-detail provider-detail--loading">
        <div className="provider-detail__skeleton provider-detail__skeleton--avatar" />
        <div className="provider-detail__skeleton provider-detail__skeleton--title" />
        <div className="provider-detail__skeleton provider-detail__skeleton--row" />
        <div className="provider-detail__skeleton provider-detail__skeleton--row" />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="provider-detail provider-detail--error">
        <p className="provider-detail__error-msg">{S.errorGeneric}</p>
      </div>
    );
  }

  return (
    <div className="provider-detail">
      <div className="provider-detail__topbar">
        <button className="provider-detail__back" onClick={() => navigate(-1)}>
          {S.back}
        </button>
        <button
          className="provider-detail__edit-btn"
          onClick={() => navigate(`/providers/${provider.id}/edit`)}
        >
          {S.edit}
        </button>
      </div>

      <div className="provider-detail__avatar-wrap">
        <div className="provider-detail__avatar">{getInitials(provider.name)}</div>
      </div>

      <div className="provider-detail__content">
        <div className="provider-detail__name-row">
          <h1 className="provider-detail__name">{provider.name}</h1>
          <span
            className={`provider-detail__status${
              provider.is_active ? '' : ' provider-detail__status--inactive'
            }`}
          >
            {provider.is_active ? S.providerActive : S.providerInactive}
          </span>
        </div>

        {/* Contact info */}
        {(provider.contact_name || provider.phone || provider.email) && (
          <div className="provider-detail__info">
            {provider.contact_name && (
              <div className="provider-detail__info-row">
                <span className="provider-detail__info-label">{S.providerContactName}</span>
                <span className="provider-detail__info-value">{provider.contact_name}</span>
              </div>
            )}
            {provider.phone && (
              <div className="provider-detail__info-row">
                <span className="provider-detail__info-label">{S.providerPhone}</span>
                <a className="provider-detail__info-value mono" href={`tel:${provider.phone}`}>
                  {provider.phone}
                </a>
              </div>
            )}
            {provider.email && (
              <div className="provider-detail__info-row">
                <span className="provider-detail__info-label">{S.providerEmail}</span>
                <a className="provider-detail__info-value" href={`mailto:${provider.email}`}>
                  {provider.email}
                </a>
              </div>
            )}
          </div>
        )}

        {provider.notes && (
          <div className="provider-detail__notes">
            <span className="provider-detail__notes-label">{S.providerNotes}</span>
            <p className="provider-detail__notes-text">{provider.notes}</p>
          </div>
        )}

        {/* ── Linked POs ── */}
        <section className="provider-detail__section">
          <h2 className="provider-detail__section-title">
            {S.providerLinkedPOs}
            <span className="provider-detail__count mono">{linkedPOs.length}</span>
          </h2>
          {linkedPOs.length === 0 ? (
            <div className="provider-detail__empty">{S.providerNoPOs}</div>
          ) : (
            <div className="provider-detail__list">
              {linkedPOs.map((po) => (
                <button
                  key={po.id}
                  className="provider-detail__link-row"
                  onClick={() => navigate(`/po/${po.id}`)}
                >
                  <span className="provider-detail__link-num mono">{po.po_number}</span>
                  <span className="provider-detail__link-title">{po.title}</span>
                  <span className="provider-detail__link-amount mono">
                    {formatCurrency(po.total, po.currency)}
                  </span>
                  <StatusBadge status={po.status} />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── Linked MOs ── */}
        <section className="provider-detail__section">
          <h2 className="provider-detail__section-title">
            {S.providerLinkedMOs}
            <span className="provider-detail__count mono">{linkedMOs.length}</span>
          </h2>
          {linkedMOs.length === 0 ? (
            <div className="provider-detail__empty">{S.providerNoMOs}</div>
          ) : (
            <div className="provider-detail__list">
              {linkedMOs.map((mo) => (
                <button
                  key={mo.id}
                  className="provider-detail__link-row"
                  onClick={() => navigate(`/mo/${mo.id}`)}
                >
                  <span className="provider-detail__link-num mono">{mo.mo_number}</span>
                  <span className="provider-detail__link-title">{mo.title}</span>
                  <span className="provider-detail__link-amount mono">
                    {formatCurrency(mo.item_price, mo.currency)}
                  </span>
                  <StatusBadge status={mo.status} />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── Linked Assets ── */}
        <section className="provider-detail__section">
          <h2 className="provider-detail__section-title">
            {S.providerLinkedAssets}
            <span className="provider-detail__count mono">{linkedAssets.length}</span>
          </h2>
          {linkedAssets.length === 0 ? (
            <div className="provider-detail__empty">{S.providerNoAssets}</div>
          ) : (
            <div className="provider-detail__list">
              {linkedAssets.map((asset) => (
                <button
                  key={asset.id}
                  className="provider-detail__link-row"
                  onClick={() => navigate(`/assets/${asset.id}`)}
                >
                  <span className="provider-detail__link-title">{asset.name}</span>
                  <span className="provider-detail__link-dept">{asset.department}</span>
                  <span className="provider-detail__link-type">
                    {asset.type === 'car' ? S.assetTypeCar : S.assetTypeOther}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}