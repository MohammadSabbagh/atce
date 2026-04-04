// src/features/po/POList.jsx

import { usePOList } from './hooks/usePOList'
import { S } from '@/lib/strings'
import POCard from './POCard'
import FilterChips from '@/components/ui/FilterChips'
import '@/styles/po-list.scss'

const STATUS_FILTERS = [
  { value: 'all',         label: S.filterAll },
  { value: 'ceo_pending', label: S.filterCeoPending },
  { value: 'pending',     label: S.statusPending },
  { value: 'approved',    label: S.statusApproved },
  { value: 'released',    label: S.statusReleased },
  { value: 'rejected',    label: S.statusRejected },
  { value: 'resubmitted', label: S.statusResubmitted },
  { value: 'cancelled',   label: S.statusCancelled },
]

export default function POList() {
  const {
    pos,
    expandedId,
    toggleExpand,
    statusFilter,
    setStatusFilter,
    deptFilter,
    setDeptFilter,
    availableDepts,
    filterKey,
  } = usePOList()

  const deptFilterOptions = [
    { value: 'all', label: S.filterAll },
    ...availableDepts.map((d) => ({ value: d, label: d })),
  ]

  // When a special filterKey is active, highlight its chip.
  // Tapping any other chip clears the filterKey and activates standard filtering.
  const activeStatus = filterKey === 'ceo_pending'
    ? 'ceo_pending'
    : filterKey
      ? 'all'
      : statusFilter

  return (
    <div className="po-list">
      <div className="po-list__header">
        <h1 className="po-list__title">{S.navPOList}</h1>
        <span className="po-list__count mono">{pos.length}</span>
      </div>

      <div className="po-list__filters">
        <FilterChips
          options={STATUS_FILTERS}
          value={activeStatus}
          onChange={setStatusFilter}
        />
        {availableDepts.length > 1 && (
          <FilterChips
            options={deptFilterOptions}
            value={deptFilter}
            onChange={setDeptFilter}
            variant="dept"
          />
        )}
      </div>

      <div className="po-list__items">
        {pos.length === 0 ? (
          <div className="po-list__empty">
            <p>{S.noResults}</p>
          </div>
        ) : (
          pos.map((po) => (
            <POCard
              key={po.id}
              po={po}
              isExpanded={expandedId === po.id}
              onToggle={() => toggleExpand(po.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}