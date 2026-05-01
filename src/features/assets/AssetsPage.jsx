import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssets } from './useAssets';
import AssetCard from './AssetCard';
import FilterChips from '@/components/ui/FilterChips';
import { S } from '@/lib/strings';
import { DEPARTMENTS } from '@/lib/constants';
import './AssetsPage.scss';

const TYPE_FILTERS = [
  { value: 'all',   label: S.filterAll },
  { value: 'car',   label: S.assetTypeCar },
  { value: 'other', label: S.assetTypeOther },
];

const DEPT_FILTERS = [
  { value: 'all', label: S.filterAll },
  ...DEPARTMENTS.map((d) => ({ value: d, label: d })),
];

export default function AssetsPage() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { assets, loading } = useAssets();

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      if (typeFilter !== 'all' && a.type !== typeFilter) return false;
      if (deptFilter !== 'all' && a.department !== deptFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          a.name?.toLowerCase().includes(q) ||
          a.plate_number?.toLowerCase().includes(q) ||
          a.model?.toLowerCase().includes(q) ||
          a.assigned_to?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [assets, typeFilter, deptFilter, search]);

  return (
    <div className="assets-page">
      <div className="assets-page__header">
        <h1 className="assets-page__title">{S.assetsTitle}</h1>
        <button
          className="assets-page__add-btn"
          onClick={() => navigate('/assets/new')}
        >
          {S.assetsAddNew}
        </button>
      </div>

      <div className="assets-page__search-wrap">
        <input
          className="assets-page__search"
          type="text"
          placeholder={S.assetsSearchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="assets-page__filters">
        <FilterChips
          options={TYPE_FILTERS}
          value={typeFilter}
          onChange={setTypeFilter}
        />
        <FilterChips
          options={DEPT_FILTERS}
          value={deptFilter}
          onChange={setDeptFilter}
        />
      </div>

      <div className="assets-page__list">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="assets-page__skeleton" />
          ))
        ) : filtered.length === 0 ? (
          <div className="assets-page__empty">{S.assetsEmpty}</div>
        ) : (
          filtered.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onClick={() => navigate(`/assets/${asset.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}