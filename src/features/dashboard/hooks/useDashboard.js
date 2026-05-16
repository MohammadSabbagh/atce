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
    // 1. PM Drafts: drafts awaiting PM action
    const pmDraftCount = pos.filter(
      p => p.status === 'draft'
    ).length

    // 2. CEO Pending: status = pending_ceo (only set when requires_ceo)
    const ceoPendingCount = pos.filter(
      p => p.status === 'pending_ceo'
    ).length

    // 3. Finance Pending Release: status = approved (single condition, no compound)
    const financePendingCount = pos.filter(
      p => p.status === 'approved'
    ).length

    // 4. Rejected count
    const rejectedCount = pos.filter(p => p.status === 'rejected').length

    // 5. Awaiting value split by currency — no cross-currency aggregation.
    //    Counts everything in flight: pending_ceo + approved.
    const inFlightPOs = pos.filter(
      p => p.status === 'pending_ceo' || p.status === 'approved'
    )
    const totalAwaitingUSD = inFlightPOs
      .filter(p => (p.currency ?? 'USD') === 'USD')
      .reduce((sum, p) => sum + (p.total ?? 0), 0)
    const totalAwaitingLS = inFlightPOs
      .filter(p => (p.currency ?? 'USD') === 'SYP')
      .reduce((sum, p) => sum + (p.total ?? 0), 0)

    // ── Department spending chart ───────────
    // Aggregate line item spend per department, excluding cancelled POs.
    // Split by currency — no cross-currency aggregation on dept charts either.
    const cancelledIds = new Set(
      allPOs.filter(p => p.status === 'cancelled').map(p => p.id)
    )

    // Build po_id → currency map for enriching line items
    const poCurrencyMap = {}
    for (const p of allPOs) {
      poCurrencyMap[p.id] = p.currency ?? 'USD'
    }

    const allLineItems = await db.po_line_items.toArray()

    // deptMap[department][currency] = total spend
    const deptMap = {}
    for (const item of allLineItems) {
      if (cancelledIds.has(item.po_id)) continue
      if (!item.department) continue
      const lineCurrency = poCurrencyMap[item.po_id] ?? 'USD'
      const lineValue = (item.quantity ?? 0) * (item.unit_price ?? 0)
      if (!deptMap[item.department]) deptMap[item.department] = { USD: 0, SYP: 0 }
      deptMap[item.department][lineCurrency] = (deptMap[item.department][lineCurrency] ?? 0) + lineValue
    }

    const deptSpending = Object.entries(deptMap)
      .map(([department, totals]) => ({ department, totalUSD: totals.USD, totalLS: totals.SYP }))
      .sort((a, b) => (b.totalUSD + b.totalLS) - (a.totalUSD + a.totalLS))

    return {
      stats: {
        pmDraftCount,
        ceoPendingCount,
        financePendingCount,
        rejectedCount,
        totalAwaitingUSD,
        totalAwaitingLS,
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