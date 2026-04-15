// features/dashboard/hooks/useDashboard.js
// Unified dashboard data hook — all 4 roles (pm, secretary, ceo, finance).
// Reads from Dexie cache via useLiveQuery — instant, reactive, no network.
// The sync engine (poSync.js) keeps the cache fresh via Supabase Realtime.

import { useLiveQuery } from 'dexie-react-hooks'
import db from '@/lib/db'

export function useDashboard() {
  const result = useLiveQuery(async () => {
    const allPOs = await db.purchase_orders.toArray()

    // Exclude cancelled from stat calculations
    const pos = allPOs.filter(p => p.status !== 'cancelled')

    // ── Stat card calculations ──────────────
    // 1. PM Drafts: Secretary-created POs awaiting PM confirmation
    const pmDraftCount = pos.filter(
      p => p.status === 'draft'
    ).length

    // 2. CEO Pending: pending AND requires_ceo=true
    const ceoPendingCount = pos.filter(
      p => p.status === 'pending' && p.requires_ceo === true
    ).length

    // 3. Finance Pending Release:
    //    approved (CEO done, Finance's turn)
    //    OR pending + requires_ceo=false (Finance acts directly)
    const financePendingCount = pos.filter(
      p =>
        p.status === 'approved' ||
        (p.status === 'pending' && p.requires_ceo === false)
    ).length

    // 4. Rejected count
    const rejectedCount = pos.filter(p => p.status === 'rejected').length

    // 5. Total awaiting value: sum of all pending POs
    const totalAwaitingValue = pos
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + (p.total ?? 0), 0)

    // ── Department spending chart ───────────
    // Aggregate line item spend per department, excluding cancelled POs.
    // This is more accurate than PO-level grouping — a single PO can have
    // items across multiple departments, each charged to the correct budget.
    const cancelledIds = new Set(
      allPOs.filter(p => p.status === 'cancelled').map(p => p.id)
    )

    const allLineItems = await db.po_line_items.toArray()

    const deptMap = {}
    for (const item of allLineItems) {
      if (cancelledIds.has(item.po_id)) continue
      if (!item.department) continue
      deptMap[item.department] = (deptMap[item.department] ?? 0) + (item.price ?? 0)
    }

    const deptSpending = Object.entries(deptMap)
      .map(([department, total]) => ({ department, total }))
      .sort((a, b) => b.total - a.total)

    return {
      stats: {
        pmDraftCount,
        ceoPendingCount,
        financePendingCount,
        rejectedCount,
        totalAwaitingValue,
      },
      deptSpending,
    }
  }, [])

  const syncMeta = useLiveQuery(() => db._meta.get('lastSyncedAt'), [])
  const hasSynced = !!syncMeta?.value

  const loading = result === undefined || !hasSynced

  return {
    stats:        result?.stats ?? null,
    deptSpending: result?.deptSpending ?? [],
    loading,
    error:        null,
  }
}