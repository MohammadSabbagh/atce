// src/features/po/hooks/usePOList.js

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

const ALL = 'all'

const PO_SELECT = `
  id,
  po_number,
  title,
  description,
  date,
  department,
  requires_ceo,
  status,
  total,
  created_at,
  approved_at,
  released_at,
  created_by,
  creator:profiles!created_by(full_name),
  tags:po_tags(tag),
  line_items:po_line_items(id, description, price, sort_order)
`

export function usePOList() {
  const { profile, role } = useAuth()
  const [allPOs, setAllPOs]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [statusFilter, setStatusFilter] = useState(ALL)
  const [deptFilter, setDeptFilter]     = useState(ALL)
  const [expandedId, setExpandedId]     = useState(null)

  useEffect(() => {
    if (!profile?.id || !role) return
    fetchPOs()
  }, [profile?.id, role])

  async function fetchPOs() {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('purchase_orders')
        .select(PO_SELECT)
        .order('created_at', { ascending: false })

      // Role-aware server-side filtering
      switch (role) {
        case 'purchase_manager':
        case 'secretary':
          // RLS handles access — both roles see all POs
          break
        case 'ceo':
          // CEO sees all POs — requires_ceo filter only applies in the approvals queue
          break
        case 'finance':
          // Finance sees all — no filter
          break
        default:
          setAllPOs([])
          setLoading(false)
          return
      }

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError
        setAllPOs((data ?? []).map(po => ({
          ...po,
          tags: po.tags?.map(t => typeof t === 'string' ? t : t.tag) ?? []
        })))

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Client-side filter chips
  const filtered = useMemo(() => {
    return allPOs.filter((po) => {
      const statusMatch = statusFilter === ALL || po.status === statusFilter
      const deptMatch   = deptFilter === ALL   || po.department === deptFilter
      return statusMatch && deptMatch
    })
  }, [allPOs, statusFilter, deptFilter])

  // Departments present in the current role's base set
  const availableDepts = useMemo(() => {
    const depts = [...new Set(allPOs.map((po) => po.department))]
    return depts.sort()
  }, [allPOs])

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return {
    pos: filtered,
    loading,
    error,
    expandedId,
    toggleExpand,
    statusFilter, setStatusFilter,
    deptFilter,   setDeptFilter,
    availableDepts,
    refetch: fetchPOs,
  }
}