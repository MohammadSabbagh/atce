import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProviders } from './useProviders';
import ProviderCard from './ProviderCard';
import { S } from '@/lib/strings';
import './ProvidersPage.scss';

export default function ProvidersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { providers, loading } = useProviders();

  const filtered = useMemo(() => {
    if (!search.trim()) return providers;
    const q = search.toLowerCase();
    return providers.filter((p) =>
      p.name?.toLowerCase().includes(q) ||
      p.contact_name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.phone?.toLowerCase().includes(q)
    );
  }, [providers, search]);

  return (
    <div className="providers-page">
      <div className="providers-page__header">
        <h1 className="providers-page__title">{S.providersTitle}</h1>
        <button
          className="providers-page__add-btn"
          onClick={() => navigate('/providers/new')}
        >
          {S.providersAddNew}
        </button>
      </div>

      <div className="providers-page__search-wrap">
        <input
          className="providers-page__search"
          type="text"
          placeholder={S.providersSearchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="providers-page__list">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="providers-page__skeleton" />
          ))
        ) : filtered.length === 0 ? (
          <div className="providers-page__empty">{S.providersEmpty}</div>
        ) : (
          filtered.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onClick={() => navigate(`/providers/${provider.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}