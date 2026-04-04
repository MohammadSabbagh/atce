// src/features/po/hooks/usePOList.js
// URL params are the single source of truth for filter state.
// Chip changes update the URL → filters derive from URL → list re-renders.
// Bookmarkable, back-button aware, shareable.

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  const { profile, role }               = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [allPOs, setAllPOs]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [expandedId, setExpandedId]     = useState(null)

  // ── Read filters from URL ──────────────────────────────────────────
  const statusFilter = searchParams.get('status')     ?? ALL
  const deptFilter   = searchParams.get('department') ?? ALL
  const filterKey    = searchParams.get('filter')     // 'finance_pending' | null
  const dateFrom     = searchParams.get('date_from')  ?? ''
  const dateTo       = searchParams.get('date_to')    ?? ''

  // ── Write filters to URL ───────────────────────────────────────────
  function setStatusFilter(value) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.delete('filter')
      next.delete('requires_ceo')

      if (value === 'ceo_pending') {
        next.delete('status')
        next.set('filter', 'ceo_pending')
      } else if (value === ALL) {
        next.delete('status')
      } else {
        next.set('status', value)
      }
      return next
    })
    setExpandedId(null)
  }

  function setDeptFilter(value) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value === ALL) {
        next.delete('department')
      } else {
        next.set('department', value)
      }
      return next
    })
    setExpandedId(null)
  }

  function setDateFrom(value) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (!value) {
        next.delete('date_from')
      } else {
        next.set('date_from', value)
      }
      return next
    })
    setExpandedId(null)
  }

  function setDateTo(value) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (!value) {
        next.delete('date_to')
      } else {
        next.set('date_to', value)
      }
      return next
    })
    setExpandedId(null)
  }

  function clearDateRange() {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.delete('date_from')
      next.delete('date_to')
      return next
    })
  }

  // ── Data fetch ────────────────────────────────────────────────────
  useEffect(() => {
    if (!profile?.id || !role) return
    fetchPOs()
  }, [profile?.id, role])

  async function fetchPOs() {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('purchase_orders')
        .select(PO_SELECT)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setAllPOs((data ?? []).map(po => ({
        ...po,
        tags: po.tags?.map(t => typeof t === 'string' ? t : t.tag) ?? [],
      })))

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Client-side filtering ──────────────────────────────────────────
  const filtered = useMemo(() => {
    return allPOs.filter((po) => {
      // Date range — po.date is YYYY-MM-DD, inputs produce YYYY-MM-DD: safe string compare
      const dateMatch =
        (!dateFrom || po.date >= dateFrom) &&
        (!dateTo   || po.date <= dateTo)

      if (!dateMatch) return false

      // Compound Finance filter: approved OR (pending + !requires_ceo)
      if (filterKey === 'finance_pending') {
        const financeMatch =
          po.status === 'approved' ||
          (po.status === 'pending' && !po.requires_ceo)
        const deptMatch = deptFilter === ALL || po.department === deptFilter
        return financeMatch && deptMatch
      }

      // Compound CEO filter: pending + requires_ceo=true
      if (filterKey === 'ceo_pending') {
        const ceoMatch = po.status === 'pending' && po.requires_ceo === true
        const deptMatch = deptFilter === ALL || po.department === deptFilter
        return ceoMatch && deptMatch
      }

      // Standard filters
      const statusMatch = statusFilter === ALL || po.status === statusFilter
      const deptMatch   = deptFilter   === ALL || po.department === deptFilter
      return statusMatch && deptMatch
    })
  }, [allPOs, statusFilter, deptFilter, filterKey, dateFrom, dateTo])

  // Departments from full unfiltered set
  const availableDepts = useMemo(() => {
    return [...new Set(allPOs.map(po => po.department))].sort()
  }, [allPOs])

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  return {
    pos: filtered,
    loading,
    error,
    expandedId,
    toggleExpand,
    statusFilter,
    setStatusFilter,
    deptFilter,
    setDeptFilter,
    availableDepts,
    filterKey,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    clearDateRange,
    refetch: fetchPOs,
  }
}