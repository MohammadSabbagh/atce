// src/features/po/POList.jsx

import { useState } from 'react'
import { usePOList } from './hooks/usePOList'
import { S } from '@/lib/strings'
import POCard from './POCard'
import FilterChips from '@/components/ui/FilterChips'
import { LiveIndicator } from '@/features/dashboard/components/LiveIndicator'
import '@/styles/po-list.scss'

const STATUS_FILTERS = [
  { value: 'all',         label: S.filterAll },
  { value: 'ceo_pending', label: S.filterCeoPending },
  { value: 'pending',     label: S.statusPending },
  { value: 'approved',    label: S.statusApproved },
  { value: 'released',    label: S.statusReleased },
  { value: 'rejected',    label: S.statusRejected },
  //{ value: 'resubmitted', label: S.statusResubmitted },
  { value: 'cancelled',   label: S.statusCancelled },
]

export default function POList() {
  const {
    pos,
    loading,
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
  } = usePOList()

  const [filtersOpen, setFiltersOpen] = useState(false)

  const activeStatus = filterKey === 'ceo_pending'
    ? 'ceo_pending'
    : filterKey
      ? 'all'
      : statusFilter

  const hasDeptFilter = deptFilter && deptFilter !== 'all'
  const hasDateFilter = !!(dateFrom || dateTo)
  const hasSecondary  = hasDeptFilter || hasDateFilter

  const fmtDate = (iso) => {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y}`
  }

  const dateSummary = hasDateFilter
    ? [dateFrom ? fmtDate(dateFrom) : '...', dateTo ? fmtDate(dateTo) : '...'].join(' – ')
    : ''

  return (
    <div className="po-list">
      {/* ── Header ── */}
      <div className="po-list__header">
        <h1 className="po-list__title">{S.navPOList}</h1>
        <span className="po-list__count mono">{pos.length}</span>

        <LiveIndicator />

        <button
          className={`po-list__funnel ${hasSecondary ? 'po-list__funnel--active' : ''}`}
          onClick={() => setFiltersOpen(prev => !prev)}
          aria-label={S.filters}
          aria-expanded={filtersOpen}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M2.25 4.5H15.75M4.5 9H13.5M6.75 13.5H11.25"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {hasSecondary && !filtersOpen && (
            <span className="po-list__funnel-dot" />
          )}
        </button>
      </div>

      {/* ── Collapsible secondary filters ── */}
      {filtersOpen && (
        <div className="po-list__secondary-filters">
          <div className="po-list__dept-field">
            <label className="po-list__dept-label">{S.department}</label>
            <select
              className="po-list__dept-select"
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
            >
              <option value="all">{S.filterAll}</option>
              {availableDepts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="po-list__date-range">
            <div className="po-list__date-field">
              <label className="po-list__date-label">{S.filterDateFrom}</label>
              <input
                type="date"
                className="po-list__date-input"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={e => setDateFrom(e.target.value)}
              />
            </div>
            <span className="po-list__date-sep">—</span>
            <div className="po-list__date-field">
              <label className="po-list__date-label">{S.filterDateTo}</label>
              <input
                type="date"
                className="po-list__date-input"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={e => setDateTo(e.target.value)}
              />
            </div>
            {hasDateFilter && (
              <button
                className="po-list__date-clear"
                onClick={clearDateRange}
                aria-label="مسح التاريخ"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Active filter summary chips ── */}
      {hasSecondary && !filtersOpen && (
        <div className="po-list__active-tags">
          {hasDeptFilter && (
            <button
              className="po-list__active-tag"
              onClick={() => setFiltersOpen(true)}
            >
              <span className="po-list__active-tag-label">{deptFilter}</span>
              <span
                className="po-list__active-tag-x"
                onClick={(e) => { e.stopPropagation(); setDeptFilter('all') }}
              >
                ✕
              </span>
            </button>
          )}
          {hasDateFilter && (
            <button
              className="po-list__active-tag"
              onClick={() => setFiltersOpen(true)}
            >
              <span className="po-list__active-tag-label">{dateSummary}</span>
              <span
                className="po-list__active-tag-x"
                onClick={(e) => { e.stopPropagation(); clearDateRange() }}
              >
                ✕
              </span>
            </button>
          )}
        </div>
      )}

      {/* ── Status chips — always visible ── */}
      <div className="po-list__status-chips">
        <FilterChips
          options={STATUS_FILTERS}
          value={activeStatus}
          onChange={setStatusFilter}
        />
      </div>

      {/* ── PO cards ── */}
      <div className="po-list__items">
        {loading ? (
          <div className="po-list__loading">
            <p>{S.loading}</p>
          </div>
        ) : pos.length === 0 ? (
          <div className="po-list__empty">
            <p>{S.noResults}</p>
          </div>
        ) : (
          pos.map((po) => (
            <POCard key={po.id} po={po} />
          ))
        )}
      </div>
    </div>
  )
}