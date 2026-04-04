// features/po/hooks/usePOListFilters.js
// Reads URL search params set by dashboard stat card navigation
// and returns the active filter state for PO list to consume.
//
// Supported URL params:
//   ?status=pending
//   ?status=pending&requires_ceo=true    → CEO pending preset
//   ?status=rejected
//   ?filter=finance_pending              → compound Finance filter
//
// The PO list calls this hook to initialize its filter state,
// then the user can adjust filters freely from there.

import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export function usePOListFilters() {
  const [searchParams] = useSearchParams()

  const initialFilters = useMemo(() => {
    const status      = searchParams.get('status')      ?? 'all'
    const requiresCeo = searchParams.get('requires_ceo') // 'true' | null
    const filterKey   = searchParams.get('filter')      // 'finance_pending' | null
    const department  = searchParams.get('department')  ?? 'all'

    return {
      status,
      requiresCeo: requiresCeo === 'true' ? true : null,
      filterKey,   // special compound filter key
      department,
    }
  }, [searchParams])

  return initialFilters
}

// ─────────────────────────────────────────
// Helper: build Supabase query filters from active filter state
// Called inside usePOList.js to apply filters to the query
// ─────────────────────────────────────────
export function applyPOFilters(query, filters) {
  const { status, requiresCeo, filterKey, department } = filters

  // Special compound filter: Finance pending release
  // status=approved OR (status=pending AND requires_ceo=false)
  if (filterKey === 'finance_pending') {
    query = query.or(
      'status.eq.approved,and(status.eq.pending,requires_ceo.eq.false)'
    )
    return query
  }

  // Standard status filter
  if (status && status !== 'all') {
    // resubmitted is treated as pending in the filter for display grouping
    if (status === 'pending') {
      query = query.in('status', ['pending', 'resubmitted'])
    } else {
      query = query.eq('status', status)
    }
  }

  // CEO pending sub-filter
  if (requiresCeo === true) {
    query = query.eq('requires_ceo', true)
  }

  // Department filter
  if (department && department !== 'all') {
    query = query.eq('department', department)
  }

  return query
}