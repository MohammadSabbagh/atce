import { usePOList } from './usePOList'
import { useAuth } from '@/context/AuthContext'
import POCard from './POCard'
import FilterChips from '@/components/ui/FilterChips'
import '@/styles/po-list.scss'

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
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
  } = usePOList()

  const deptFilterOptions = [
    { value: 'all', label: 'All Depts' },
    ...availableDepts.map((d) => ({ value: d, label: d })),
  ]

  const title = role === 'finance' ? 'All Orders' : 'Purchase Orders'

  return (
    <div className="po-list">
      <div className="po-list__header">
        <h1 className="po-list__title">{title}</h1>
        <span className="po-list__count mono">{pos.length}</span>
      </div>

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

      <div className="po-list__items">
        {pos.length === 0 ? (
          <div className="po-list__empty">
            <p>No purchase orders found</p>
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