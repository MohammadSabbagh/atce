import { useNavigate } from 'react-router-dom';
import { useMOList } from './useMoList';
import MOCard from './MoCard';
import FilterChips from '@/components/ui/FilterChips';
import { S } from '@/lib/strings';
import './MoList.scss';

const TYPE_FILTERS = [
  { value: 'all',   label: S.filterAll },
  { value: 'car',   label: S.assetTypeCar },
  { value: 'other', label: S.assetTypeOther },
];

const STATUS_FILTERS = [
  { value: 'all',       label: S.filterAll },
  { value: 'draft',     label: S.statusDraft },
  { value: 'pending',   label: S.statusPending },
  { value: 'approved',  label: S.statusApproved },
  { value: 'released',  label: S.statusReleased },
  { value: 'rejected',  label: S.statusRejected },
  { value: 'cancelled', label: S.statusCancelled },
];

export default function MOList() {
  const navigate = useNavigate();
  const {
    mos,
    loading,
    statusFilter,
    typeFilter,
    setStatusFilter,
    setTypeFilter,
  } = useMOList();

  return (
    <div className="mo-list">
      <div className="mo-list__header">
        <h1 className="mo-list__title">{S.moListTitle}</h1>
        <button
          className="mo-list__add-btn"
          onClick={() => navigate('/mo/create')}
        >
          {S.moAddNew}
        </button>
      </div>

      <div className="mo-list__filters">
        <FilterChips
          options={TYPE_FILTERS}
          value={typeFilter}
          onChange={setTypeFilter}
        />
        <FilterChips
          options={STATUS_FILTERS}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      <div className="mo-list__body">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="mo-list__skeleton" />
          ))
        ) : mos.length === 0 ? (
          <div className="mo-list__empty">{S.moEmpty}</div>
        ) : (
          mos.map((mo) => (
            <MOCard
              key={mo.id}
              mo={mo}
              onClick={() => navigate(`/mo/${mo.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}