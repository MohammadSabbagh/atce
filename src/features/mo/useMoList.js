// src/features/mo/useMoList.js
// URL params are the single source of truth for filter state.
// Data reads from Dexie (IndexedDB) via useLiveQuery — instant on every visit.
// The sync engine (moSync.js) keeps the cache fresh via Supabase Realtime.
//
// MO has a flat `department` column on the row itself (unlike PO which derives
// departments from line items), so dept filtering is a direct equality check.

import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import db from '@/lib/db'

const ALL = 'all'

export function useMOList() {
  const [searchParams, setSearchParams] = useSearchParams()

  // ── Read filters from URL ──────────────────────────────────────────
  const statusFilter = searchParams.get('status')     ?? ALL
  const typeFilter   = searchParams.get('type')       ?? ALL
  const deptFilter   = searchParams.get('department') ?? ALL
  const dateFrom     = searchParams.get('date_from')  ?? ''
  const dateTo       = searchParams.get('date_to')    ?? ''
  const searchQuery  = searchParams.get('q')          ?? ''

  // ── Write filters to URL ───────────────────────────────────────────
  function setStatusFilter(value) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value === ALL) next.delete('status')
      else next.set('status', value)
      return next
    })
  }

  function setTypeFilter(value) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value === ALL) next.delete('type')
      else next.set('type', value)
      return next
    })
  }

  function setDeptFilter(value) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value === ALL) next.delete('department')
      else next.set('department', value)
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

  function setSearchQuery(value) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (!value) next.delete('q')
      else next.set('q', value)
      return next
    })
  }

  function clearSearch() {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.delete('q')
      return next
    })
  }

  // ── Read all MOs from Dexie ────────────────────────────────────────
  const allMOs = useLiveQuery(
    () => db.maintenance_orders.orderBy('created_at').reverse().toArray(),
    []
  )

  const loading = allMOs === undefined
  const moArray = allMOs ?? []

  // ── Client-side filtering ──────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()

    return moArray.filter((mo) => {
      // Text search: mo_number prefix OR title substring
      if (q) {
        const numberMatch = mo.mo_number?.toLowerCase().startsWith(q)
        const titleMatch  = mo.title?.toLowerCase().includes(q)
        if (!numberMatch && !titleMatch) return false
      }

      // Date range (against created_at)
      const dateMatch =
        (!dateFrom || mo.created_at >= dateFrom) &&
        (!dateTo   || mo.created_at <= dateTo + 'T23:59:59')
      if (!dateMatch) return false

      // Department: direct equality on flat column
      if (deptFilter !== ALL && mo.department !== deptFilter) return false

      // Type: direct equality
      if (typeFilter !== ALL && mo.type !== typeFilter) return false

      // Status
      if (statusFilter !== ALL && mo.status !== statusFilter) return false

      return true
    })
  }, [moArray, statusFilter, typeFilter, deptFilter, dateFrom, dateTo, searchQuery])

  // ── Available departments (for the dept dropdown) ──────────────────
  // Derived from the MOs themselves — flat column.
  const availableDepts = useMemo(() => {
    const depts = new Set()
    for (const mo of moArray) {
      if (mo.department) depts.add(mo.department)
    }
    return [...depts].sort()
  }, [moArray])

  return {
    mos: filtered,
    loading,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    deptFilter,
    setDeptFilter,
    availableDepts,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    clearDateRange,
    searchQuery,
    setSearchQuery,
    clearSearch,
  }
}