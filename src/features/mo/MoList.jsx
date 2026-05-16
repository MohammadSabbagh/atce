// src/features/mo/MoList.jsx
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useMOList } from './useMoList'
import { S } from '@/lib/strings'
import MOCard from './MoCard'
import FilterChips from '@/components/ui/FilterChips'
import NavIcon from '@/components/layout/NavIcon'
import './MoList.scss'

const STATUS_FILTERS = [
  { value: 'all',       label: S.filterAll },
  { value: 'draft',     label: S.statusDraft },
  { value: 'pending_ceo',   label: S.filterPendingCeo },
  { value: 'approved',  label: S.statusApproved },
  { value: 'released',  label: S.statusReleased },
  { value: 'rejected',  label: S.statusRejected },
  { value: 'cancelled', label: S.statusCancelled },
]

export default function MOList() {
  const navigate = useNavigate()
  const {
    mos,
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
  } = useMOList()

  const [filtersOpen, setFiltersOpen] = useState(false)

  const hasTypeFilter   = typeFilter && typeFilter !== 'all'
  const hasDeptFilter   = deptFilter && deptFilter !== 'all'
  const hasDateFilter   = !!(dateFrom || dateTo)
  const hasSearchFilter = !!searchQuery.trim()
  const hasSecondary    = hasTypeFilter || hasDeptFilter || hasDateFilter || hasSearchFilter

  const fmtDate = (iso) => {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y}`
  }

  const dateSummary = hasDateFilter
    ? [dateFrom ? fmtDate(dateFrom) : '...', dateTo ? fmtDate(dateTo) : '...'].join(' – ')
    : ''

  const typeLabel = typeFilter === 'car'
    ? S.assetTypeCar
    : typeFilter === 'other'
      ? S.assetTypeOther
      : ''

  return (
    <div className="mo-list">
      {/* ── Header ── */}
      <div className="mo-list__header">
        <h1 className="mo-list__title">{S.moListTitle}</h1>
        <span className="mo-list__count mono">{mos.length}</span>
        <button
          className="mo-list__add-btn"
          onClick={() => navigate('/mo/create')}
        >
          <NavIcon name={'plus'} />
        </button>
        <button
          className={`mo-list__funnel ${hasSecondary ? 'mo-list__funnel--active' : ''}`}
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
            <span className="mo-list__funnel-dot" />
          )}
        </button>
      </div>

      {/* ── Collapsible secondary filters ── */}
      {filtersOpen && (
        <div className="mo-list__secondary-filters">
          <div className="mo-list__search-field">
            <label className="mo-list__search-label">{S.filterSearch}</label>
            <div className="mo-list__search-wrap">
              <input
                type="search"
                className="mo-list__search-input"
                placeholder={S.filterSearchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              {hasSearchFilter && (
                <button
                  className="mo-list__search-clear"
                  onClick={clearSearch}
                  aria-label="مسح البحث"
                >✕</button>
              )}
            </div>
          </div>

          <div className="mo-list__select-row">
            <div className="mo-list__dept-field">
              <label className="mo-list__dept-label">{S.department}</label>
              <select
                className="mo-list__dept-select"
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
              >
                <option value="all">{S.filterAll}</option>
                {availableDepts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="mo-list__type-field">
              <label className="mo-list__type-label">{S.assetType}</label>
              <select
                className="mo-list__type-select"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
              >
                <option value="all">{S.filterAll}</option>
                <option value="car">{S.assetTypeCar}</option>
                <option value="other">{S.assetTypeOther}</option>
              </select>
            </div>
          </div>

          <div className="mo-list__date-range">
            <div className="mo-list__date-field">
              <label className="mo-list__date-label">{S.filterDateFrom}</label>
              <input
                type="date"
                className="mo-list__date-input"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={e => setDateFrom(e.target.value)}
              />
            </div>
            <span className="mo-list__date-sep">—</span>
            <div className="mo-list__date-field">
              <label className="mo-list__date-label">{S.filterDateTo}</label>
              <input
                type="date"
                className="mo-list__date-input"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={e => setDateTo(e.target.value)}
              />
            </div>
            {hasDateFilter && (
              <button
                className="mo-list__date-clear"
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
        <div className="mo-list__active-tags">
          {hasSearchFilter && (
            <button
              className="mo-list__active-tag"
              onClick={() => setFiltersOpen(true)}
            >
              <span className="mo-list__active-tag-label">"{searchQuery}"</span>
              <span
                className="mo-list__active-tag-x"
                onClick={(e) => { e.stopPropagation(); clearSearch() }}
              >
                ✕
              </span>
            </button>
          )}
          {hasDeptFilter && (
            <button
              className="mo-list__active-tag"
              onClick={() => setFiltersOpen(true)}
            >
              <span className="mo-list__active-tag-label">{deptFilter}</span>
              <span
                className="mo-list__active-tag-x"
                onClick={(e) => { e.stopPropagation(); setDeptFilter('all') }}
              >
                ✕
              </span>
            </button>
          )}
          {hasTypeFilter && (
            <button
              className="mo-list__active-tag"
              onClick={() => setFiltersOpen(true)}
            >
              <span className="mo-list__active-tag-label">{typeLabel}</span>
              <span
                className="mo-list__active-tag-x"
                onClick={(e) => { e.stopPropagation(); setTypeFilter('all') }}
              >
                ✕
              </span>
            </button>
          )}
          {hasDateFilter && (
            <button
              className="mo-list__active-tag"
              onClick={() => setFiltersOpen(true)}
            >
              <span className="mo-list__active-tag-label">{dateSummary}</span>
              <span
                className="mo-list__active-tag-x"
                onClick={(e) => { e.stopPropagation(); clearDateRange() }}
              >
                ✕
              </span>
            </button>
          )}
        </div>
      )}

      {/* ── Status chips — always visible ── */}
      <div className="mo-list__status-chips">
        <FilterChips
          options={STATUS_FILTERS}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      {/* ── MO cards ── */}
      <div className="mo-list__items">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="mo-list__skeleton" />
          ))
        ) : mos.length === 0 ? (
          <div className="mo-list__empty">
            <p>{S.moEmpty}</p>
          </div>
        ) : (
          mos.map((mo) => (
            <MOCard
              key={mo.id}
              mo={mo}
              onClick={() => navigate(`/mo/${mo.id}`)}
            />
          ))
        )}
      </div>
    </div>
  )
}