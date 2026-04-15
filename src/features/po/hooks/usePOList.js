// src/features/po/hooks/usePOList.js
// URL params are the single source of truth for filter state.
// Data reads from Dexie (IndexedDB) via useLiveQuery — instant on every visit.
// The sync engine (poSync.js) keeps the cache fresh via Supabase Realtime.
//
// Department filtering joins against po_line_items — a PO matches if ANY of its
// items belong to the selected department.

import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '@/lib/db'

const ALL = 'all'

export function usePOList() {
  const [searchParams, setSearchParams] = useSearchParams()

  // ── Read filters from URL ──────────────────────────────────────────
  const statusFilter = searchParams.get('status')     ?? ALL
  const deptFilter   = searchParams.get('department') ?? ALL
  const filterKey    = searchParams.get('filter')     // 'ceo_pending' | 'finance_pending' | null
  const dateFrom     = searchParams.get('date_from')  ?? ''
  const dateTo       = searchParams.get('date_to')    ?? ''

  // ── Write filters to URL ───────────────────────────────────────────
  function setStatusFilter(value) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.delete('filter')
      next.delete('requires_ceo')

      if (value === 'ceo_pending' || value === 'finance_pending') {
        next.delete('status')
        next.set('filter', value)
      } else if (value === ALL) {
        next.delete('status')
      } else {
        next.set('status', value)
      }
      return next
    })
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
  }

  function setDateFrom(value) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (!value) next.delete('date_from')
      else next.set('date_from', value)
      return next
    })
  }

  function setDateTo(value) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (!value) next.delete('date_to')
      else next.set('date_to', value)
      return next
    })
  }

  function clearDateRange() {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.delete('date_from')
      next.delete('date_to')
      return next
    })
  }

  // ── Read all POs from Dexie ────────────────────────────────────────
  const allPOs = useLiveQuery(
    () => db.purchase_orders.orderBy('date').reverse().toArray(),
    []
  )

  // ── Read all line items from Dexie ────────────────────────────────
  // Used for department filtering and availableDepts derivation.
  const allLineItems = useLiveQuery(
    () => db.po_line_items.toArray(),
    []
  )

  const syncMeta = useLiveQuery(() => db._meta.get('lastSyncedAt'), [])
  const hasSynced = !!syncMeta?.value

  const poArray       = allPOs       ?? []
  const lineItemArray = allLineItems ?? []
  const loading = allPOs === undefined || allLineItems === undefined || (!hasSynced && poArray.length === 0)

  // ── Build po_id → departments[] map for filtering ─────────────────
  // Computed once per line item array change, shared by both filtered and availableDepts.
  const poDeptsMap = useMemo(() => {
    const map = {} // po_id → Set<department>
    for (const item of lineItemArray) {
      if (!item.department) continue
      if (!map[item.po_id]) map[item.po_id] = new Set()
      map[item.po_id].add(item.department)
    }
    return map
  }, [lineItemArray])

  // ── Client-side filtering ──────────────────────────────────────────
  const filtered = useMemo(() => {
    return poArray.filter((po) => {
      // Date range
      const dateMatch =
        (!dateFrom || po.date >= dateFrom) &&
        (!dateTo   || po.date <= dateTo)
      if (!dateMatch) return false

      // Department: PO matches if ANY of its line items belong to the selected dept
      const deptMatch =
        deptFilter === ALL ||
        (poDeptsMap[po.id]?.has(deptFilter) ?? false)
      if (!deptMatch) return false

      // Special compound filter keys
      if (filterKey === 'finance_pending') {
        return (
          po.status === 'approved' ||
          (po.status === 'pending' && !po.requires_ceo)
        )
      }

      if (filterKey === 'ceo_pending') {
        return po.status === 'pending' && po.requires_ceo === true
      }

      // Standard status filter
      return statusFilter === ALL || po.status === statusFilter
    })
  }, [poArray, statusFilter, deptFilter, filterKey, dateFrom, dateTo, poDeptsMap])

  // ── Available departments (for the dept dropdown) ──────────────────
  // Derived from line items, not PO headers.
  const availableDepts = useMemo(() => {
    const depts = new Set()
    for (const item of lineItemArray) {
      if (item.department) depts.add(item.department)
    }
    return [...depts].sort()
  }, [lineItemArray])

  return {
    pos: filtered,
    loading,
    error: null,
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
  }
}