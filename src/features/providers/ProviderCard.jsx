import { S } from '@/lib/strings';
import './ProviderCard.scss';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0);
  return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
}

export default function ProviderCard({ provider, onClick }) {
  return (
    <div className="provider-card" onClick={onClick}>
      <div className="provider-card__avatar-col">
        <div className="provider-card__avatar">
          {getInitials(provider.name)}
        </div>
      </div>

      <div className="provider-card__body">
        <div className="provider-card__top">
          <span className="provider-card__name">{provider.name}</span>
          <span
            className={`provider-card__status${
              provider.is_active ? '' : ' provider-card__status--inactive'
            }`}
          >
            {provider.is_active ? S.providerActive : S.providerInactive}
          </span>
        </div>

        {provider.contact_name && (
          <div className="provider-card__contact">{provider.contact_name}</div>
        )}

        {(provider.phone || provider.email) && (
          <div className="provider-card__bottom">
            {provider.phone && (
              <span className="provider-card__phone mono">{provider.phone}</span>
            )}
            {provider.email && (
              <span className="provider-card__email">{provider.email}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}