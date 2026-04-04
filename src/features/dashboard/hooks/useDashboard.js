// features/dashboard/hooks/useDashboard.js
// Unified dashboard data hook — all 4 roles (pm, secretary, ceo, finance).
// RLS on purchase_orders handles row-level access per role automatically.
// This hook runs 3 parallel queries + 1 realtime subscription.

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'

const REALTIME_CHANNEL = 'dashboard-po-changes'

export function useDashboard() {
  const [stats, setStats]               = useState(null)   // stat card values
  const [deptSpending, setDeptSpending] = useState([])     // chart data
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [lastUpdated, setLastUpdated]   = useState(null)
  const channelRef                      = useRef(null)

  // ─────────────────────────────────────────
  // Core fetch — runs on mount + realtime trigger
  // ─────────────────────────────────────────
  async function fetchDashboardData() {
    try {
      // All 3 queries fire in parallel
      
      const [posResult, deptResult] = await Promise.all([
        // Query 1: fetch all POs the role can see (RLS filters automatically)
        // We only need status, requires_ceo, and total for stat cards
        supabase
          .from('purchase_orders')
          .select('id, status, requires_ceo, total')
          .not('status', 'eq', 'cancelled'), // cancelled excluded from stats

        // Query 2: department spending — released POs only (committed spend)
        supabase
          .from('purchase_orders')
          .select('department, total')
          .neq('status', 'cancelled'),
      ])

      console.log('[useDashboard] deptResult:', deptResult.data)

      if (posResult.error)  throw posResult.error
      if (deptResult.error) throw deptResult.error

      const pos = posResult.data ?? []

      // ── Stat card calculations ──────────────
      // 1. CEO Pending: pending AND requires_ceo=true
      const ceoPendingCount = pos.filter(
        p => p.status === 'pending' && p.requires_ceo === true
      ).length

      // 2. Finance Pending Release:
      //    approved (CEO done, Finance's turn)
      //    OR pending + requires_ceo=false (Finance acts directly)
      const financePendingCount = pos.filter(
        p =>
          p.status === 'approved' ||
          (p.status === 'pending' && p.requires_ceo === false)
      ).length

      // 3. Rejected count
      const rejectedCount = pos.filter(p => p.status === 'rejected').length

      // 4. Total awaiting value: sum of all pending POs
      const totalAwaitingValue = pos
        .filter(p => p.status === 'pending' || p.status === 'resubmitted')
        .reduce((sum, p) => sum + (p.total ?? 0), 0)

      setStats({
        ceoPendingCount,
        financePendingCount,
        rejectedCount,
        totalAwaitingValue,
      })

      // ── Department spending chart ───────────
      // Group released PO totals by department
      const deptMap = {}
      for (const po of deptResult.data ?? []) {
        if (!deptMap[po.department]) deptMap[po.department] = 0
        deptMap[po.department] += po.total ?? 0
      }

      const deptArray = Object.entries(deptMap)
        .map(([department, total]) => ({ department, total }))
        .sort((a, b) => b.total - a.total) // highest spend first

      setDeptSpending(deptArray)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      console.error('[useDashboard] fetch error:', err)
      setError(err.message ?? 'حدث خطأ أثناء تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  // ─────────────────────────────────────────
  // Realtime subscription
  // Any change to purchase_orders triggers a refetch
  // ─────────────────────────────────────────
  function subscribeRealtime() {
    // Clean up any existing channel first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    channelRef.current = supabase
      .channel(REALTIME_CHANNEL)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'purchase_orders' },
        () => {
          // On any INSERT / UPDATE / DELETE — refetch
          fetchDashboardData()
        }
      )
      .subscribe()
  }

  useEffect(() => {
    fetchDashboardData()
    subscribeRealtime()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    stats,
    deptSpending,
    loading,
    error,
    lastUpdated,
    refetch: fetchDashboardData,
  }
}