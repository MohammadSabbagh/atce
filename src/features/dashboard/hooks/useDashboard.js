// features/dashboard/hooks/useDashboard.js
// Unified dashboard data hook — all 4 roles (pm, secretary, ceo, finance).
// Reads from Dexie cache via useLiveQuery — instant, reactive, no network.
// The sync engine (poSync.js) keeps the cache fresh via Supabase Realtime.

import { useLiveQuery } from 'dexie-react-hooks'
import db from '@/lib/db'

export function useDashboard() {
  // ─────────────────────────────────────────
  // Single reactive query — recomputes on any Dexie write
  // ─────────────────────────────────────────
  const result = useLiveQuery(async () => {
    const allPOs = await db.purchase_orders.toArray()

    // Exclude cancelled from stat calculations
    const pos = allPOs.filter(p => p.status !== 'cancelled')

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

    // ── Department spending chart ───────────
    // Group all non-cancelled PO totals by department
    const deptMap = {}
    for (const po of pos) {
      if (!deptMap[po.department]) deptMap[po.department] = 0
      deptMap[po.department] += po.total ?? 0
    }

    const deptSpending = Object.entries(deptMap)
      .map(([department, total]) => ({ department, total }))
      .sort((a, b) => b.total - a.total) // highest spend first

    return {
      stats: {
        ceoPendingCount,
        financePendingCount,
        rejectedCount,
        totalAwaitingValue,
      },
      deptSpending,
    }
  }, [])

  // Check if initial sync has completed at least once
  const syncMeta = useLiveQuery(() => db._meta.get('lastSyncedAt'), [])
  const hasSynced = !!syncMeta?.value

  // Show loading when: Dexie query pending OR first sync not done yet
  const loading = result === undefined || !hasSynced

  return {
    stats:        result?.stats ?? null,
    deptSpending: result?.deptSpending ?? [],
    loading,
    error:        null,  // Dexie reads don't fail; sync errors logged in poSync
  }
}