// src/features/finance/hooks/useFinancePOs.js

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const DEPARTMENTS = ['Operations', 'Marketing', 'Engineering', 'HR', 'Sales', 'Legal', 'Finance']

const PO_SELECT = `
  id,
  po_number,
  title,
  department,
  status,
  total,
  requires_ceo,
  date,
  created_at,
  approved_at,
  released_at,
  creator:profiles!created_by(full_name),
  tags:po_tags(tag)
`

export function useFinancePOs() {
  const [allPos, setAllPos]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [isLive, setIsLive]           = useState(false)
  const [lastUpdate, setLastUpdate]   = useState(new Date())
  const [statusFilter, setStatusFilter] = useState('all')
  const [deptFilter, setDeptFilter]     = useState('all')

  const fetchPOs = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('purchase_orders')
      .select(PO_SELECT)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      return
    }

    setAllPos(data ?? [])
    setLastUpdate(new Date())
  }, [])

  // Initial fetch
  useEffect(() => {
    setLoading(true)
    fetchPOs().finally(() => setLoading(false))
  }, [fetchPOs])

  // Realtime subscription — Finance live dashboard
  useEffect(() => {
    const channel = supabase
      .channel('finance-po-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'purchase_orders' },
        () => {
          fetchPOs()
          setLastUpdate(new Date())
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchPOs])

  // Client-side filter chips
  const filtered = allPos.filter((po) => {
    const statusMatch = statusFilter === 'all' || po.status === statusFilter
    const deptMatch   = deptFilter === 'all'   || po.department === deptFilter
    return statusMatch && deptMatch
  })

  // ─── Derived stats ───────────────────────────────────
  const totalCount    = allPos.length
  const totalValue    = allPos.reduce((s, p) => s + p.total, 0)
  const approvedValue = allPos
    .filter(p => p.status === 'approved' || p.status === 'released')
    .reduce((s, p) => s + p.total, 0)
  const pendingValue  = allPos
    .filter(p => p.status === 'pending')
    .reduce((s, p) => s + p.total, 0)
  const rejectedCount = allPos.filter(p => p.status === 'rejected').length
  const releasedCount = allPos.filter(p => p.status === 'released').length

  // ─── Department breakdown ────────────────────────────
  const deptBreakdown = DEPARTMENTS.map((dept) => {
    const deptPos  = allPos.filter(p => p.department === dept)
    const value    = deptPos.reduce((s, p) => s + p.total, 0)
    const approved = deptPos
      .filter(p => p.status === 'approved' || p.status === 'released')
      .reduce((s, p) => s + p.total, 0)
    return { dept, value, approved, count: deptPos.length }
  })
    .filter(d => d.count > 0)
    .sort((a, b) => b.value - a.value)

  const maxDeptValue = deptBreakdown[0]?.value ?? 1

  return {
    pos: filtered,
    allPos,
    loading,
    error,
    isLive,
    lastUpdate,
    statusFilter, setStatusFilter,
    deptFilter,   setDeptFilter,
    stats: { totalCount, totalValue, approvedValue, pendingValue, rejectedCount, releasedCount },
    deptBreakdown,
    maxDeptValue,
    departments: DEPARTMENTS,
    refetch: fetchPOs,
  }
}