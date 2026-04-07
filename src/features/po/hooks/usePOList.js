// src/features/po/hooks/usePOList.js
// URL params are the single source of truth for filter state.
// Data reads from Dexie (IndexedDB) via useLiveQuery — instant on every visit.
// The sync engine (poSync.js) keeps the cache fresh via Supabase Realtime.

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

  // ── Read all POs from Dexie (reactive — re-runs on any write) ─────
  const allPOs = useLiveQuery(
    () => db.purchase_orders.orderBy('date').reverse().toArray(),
    []  // no deps — Dexie handles reactivity
  )

  // Check if initial sync has completed at least once.
  // lastSyncedAt is written by poSync after the first successful fetch.
  // Returns undefined while IndexedDB resolves, then the record or undefined if missing.
  const syncMeta = useLiveQuery(() => db._meta.get('lastSyncedAt'), [])
  const hasSynced = !!syncMeta?.value

  // useLiveQuery returns undefined on first render while IndexedDB resolves.
  // Show loading when: Dexie query pending OR cache empty + first sync not done.
  const poArray = allPOs ?? []
  const loading = allPOs === undefined || (!hasSynced && poArray.length === 0)

  // ── Client-side filtering ──────────────────────────────────────────
  const filtered = useMemo(() => {
    return poArray.filter((po) => {
      const dateMatch =
        (!dateFrom || po.date >= dateFrom) &&
        (!dateTo   || po.date <= dateTo)

      if (!dateMatch) return false

      if (filterKey === 'finance_pending') {
        const financeMatch =
          po.status === 'approved' ||
          (po.status === 'pending' && !po.requires_ceo)
        const deptMatch = deptFilter === ALL || po.department === deptFilter
        return financeMatch && deptMatch
      }

      if (filterKey === 'ceo_pending') {
        const ceoMatch = po.status === 'pending' && po.requires_ceo === true
        const deptMatch = deptFilter === ALL || po.department === deptFilter
        return ceoMatch && deptMatch
      }

      const statusMatch = statusFilter === ALL || po.status === statusFilter
      const deptMatch   = deptFilter   === ALL || po.department === deptFilter
      return statusMatch && deptMatch
    })
  }, [poArray, statusFilter, deptFilter, filterKey, dateFrom, dateTo])

  const availableDepts = useMemo(() => {
    return [...new Set(poArray.map(po => po.department))].sort()
  }, [poArray])

  return {
    pos: filtered,
    loading,
    error: null,  // Dexie reads don't fail; sync errors are logged in poSync
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