import { useState, useMemo } from 'react'
import { MOCK_PURCHASE_ORDERS } from '@/lib/mockData'
import { useAuth } from '@/context/AuthContext'

const ALL = 'all'

export function usePOList() {
  const { profile, role } = useAuth()
  const [statusFilter, setStatusFilter] = useState(ALL)
  const [deptFilter, setDeptFilter] = useState(ALL)
  const [expandedId, setExpandedId] = useState(null)

  // Role-aware base set
  const basePOs = useMemo(() => {
    switch (role) {
      case 'purchase_manager':
      case 'secretary':
        return MOCK_PURCHASE_ORDERS.filter(
          (po) => po.created_by === profile.id
        )
      case 'ceo':
        return MOCK_PURCHASE_ORDERS.filter((po) => po.requires_ceo)
      case 'finance':
        return MOCK_PURCHASE_ORDERS
      default:
        return []
    }
  }, [role, profile?.id])

  const filtered = useMemo(() => {
    return basePOs.filter((po) => {
      const statusMatch = statusFilter === ALL || po.status === statusFilter
      const deptMatch = deptFilter === ALL || po.department === deptFilter
      return statusMatch && deptMatch
    })
  }, [basePOs, statusFilter, deptFilter])

  // Departments present in current base set (for filter chips)
  const availableDepts = useMemo(() => {
    const depts = [...new Set(basePOs.map((po) => po.department))]
    return depts.sort()
  }, [basePOs])

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return {
    pos: filtered,
    expandedId,
    toggleExpand,
    statusFilter,
    setStatusFilter,
    deptFilter,
    setDeptFilter,
    availableDepts,
  }
}