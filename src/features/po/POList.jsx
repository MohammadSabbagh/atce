import { usePOList } from './usePOList'
import { useAuth } from '@/context/AuthContext'
import { S } from '@/lib/strings'
import POCard from './POCard'
import FilterChips from '@/components/ui/FilterChips'
import '@/styles/po-list.scss'

const STATUS_FILTERS = [
  { value: 'all',      label: S.filters.all },
  { value: 'pending',  label: S.status.pending },
  { value: 'approved', label: S.status.approved },
  { value: 'rejected', label: S.status.rejected },
]

export default function POList() {
  const { role } = useAuth()
  const {
    pos,
    expandedId,
    toggleExpand,
    statusFilter,
    setStatusFilter,
    deptFilter,
    setDeptFilter,
    availableDepts,
    ceoFilter,
    setCeoFilter,
    ceoQueueCount,
  } = usePOList()

  const deptFilterOptions = [
    { value: 'all', label: S.filters.allDepts },
    ...availableDepts.map((d) => ({ value: d, label: S.departments[d] ?? d })),
  ]

  const title = role === 'finance' ? S.nav.allOrders : S.nav.orders

  return (
    <div className="po-list">
      <div className="po-list__header">
        <h1 className="po-list__title">{title}</h1>
        <span className="po-list__count mono">{pos.length}</span>
      </div>

      {/* CEO approval queue chip — only visible to CEO */}
      {role === 'ceo' && (
        <div className="po-list__ceo-filter">
          <button
            className={`po-list__ceo-chip ${ceoFilter ? 'po-list__ceo-chip--active' : ''}`}
            onClick={() => setCeoFilter(!ceoFilter)}
          >
            {S.filters.ceoQueue ?? 'تحتاج موافقتي'}
            {ceoQueueCount > 0 && (
              <span className="po-list__ceo-badge">{ceoQueueCount}</span>
            )}
          </button>
        </div>
      )}

      {/* Standard filters — hidden when CEO queue is active */}
      {!ceoFilter && (
        <div className="po-list__filters">
          <FilterChips
            options={STATUS_FILTERS}
            value={statusFilter}
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
      )}

      <div className="po-list__items">
        {pos.length === 0 ? (
          <div className="po-list__empty">
            <p>{S.dashboard.noOrders}</p>
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