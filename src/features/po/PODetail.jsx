// features/po/PODetail.jsx

import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { usePODetail } from './usePODetail'
import StatusBadge from '@/components/ui/StatusBadge'
import Tag from '@/components/ui/Tag'
import NavIcon from '@/components/layout/NavIcon'
import { formatCurrency, formatDate } from '@/lib/utils'
import '@/styles/po-detail.scss'
import { getFinanceAction } from '@/lib/poStatusConfig'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtFileSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

const fileIcon = (type) => {
  if (type === 'application/pdf') return '📄'
  if (type?.startsWith('image/')) return '🖼️'
  return '📎'
}

const auditLabel = (action) => {
  const map = {
    created:   'Order Created',
    submitted: 'Submitted for Review',
    approved:  'Approved',
    rejected:  'Rejected',
    released:  'Released',
    fulfilled: 'Fulfilled',
  }
  return map[action] ?? action
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function AuditTrail({ audit }) {
  return (
    <div className="po-detail__card">
      <span className="po-detail__section-label">Approval Trail</span>
      <div className="po-detail__audit">
        {audit.map((entry, i) => (
          <div key={entry.id ?? i} className="po-detail__audit-item">
            <div className="po-detail__audit-dot-col">
              <div className={`po-detail__audit-dot po-detail__audit-dot--${entry.action}`} />
              {i < audit.length - 1 && <div className="po-detail__audit-line" />}
            </div>
            <div className="po-detail__audit-body">
              <span className="po-detail__audit-action">{auditLabel(entry.action)}</span>
              <span className="po-detail__audit-by">
                by {entry.actor?.full_name ?? '—'}
              </span>
              <span className="po-detail__audit-time">{fmtDateTime(entry.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CEOActionBar({ status, onApprove, onReject, acting }) {
  if (status === 'approved' || status === 'released') {
    return (
      <div className="po-detail__action-bar">
        <div className="po-detail__decided po-detail__decided--approved">✓ Approved</div>
      </div>
    )
  }
  if (status === 'rejected') {
    return (
      <div className="po-detail__action-bar">
        <div className="po-detail__decided po-detail__decided--rejected">✕ Rejected</div>
      </div>
    )
  }
  return (
    <div className="po-detail__action-bar">
      <button
        className="po-detail__action-btn po-detail__action-btn--approve"
        onClick={onApprove}
        disabled={acting}
      >
        {acting ? 'Saving…' : 'Approve'}
      </button>
      <button
        className="po-detail__action-btn po-detail__action-btn--reject"
        onClick={onReject}
        disabled={acting}
      >
        Reject
      </button>

    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PODetail() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const role = profile?.role

  // ✅ releasePO added, acting added
  const { po, loading, error, acting, approvePO, rejectPO, releasePO } = usePODetail()

  const isCEO     = role === 'ceo'
  const isFinance = role === 'finance'

  const financeAction = po ? getFinanceAction(po) : null

  // ✅ Show loading state while fetch is in-flight
  if (loading) {
    return (
      <div className="po-detail">
        <div className="po-detail__loading">Loading…</div>
      </div>
    )
  }

  // ✅ Only show error/not-found after loading completes
  if (error || !po) {
    return (
      <div className="po-detail">
        <div className="po-detail__not-found">
          <span style={{ fontSize: 32 }}>🔍</span>
          <p>{error ?? 'Purchase order not found.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="po-detail__back-link"
          >
            ← Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="po-detail">

      {/* ── Sticky header ── */}
      <div className="po-detail__header">
        <button className="po-detail__back" onClick={() => navigate(-1)}>
          <NavIcon name="chevron-right" size={16} />
        </button>
        <div className="po-detail__header-info">
          <span className="po-detail__po-number mono">{po.po_number}</span>
          <span className="po-detail__header-title">{po.title}</span>
        </div>
        <StatusBadge status={po.status} />
      </div>

      <div className="po-detail__content">

        {/* ── Overview card ── */}
        <div className="po-detail__card">
          <div className="po-detail__overview-top">
            <h1 className="po-detail__title">{po.title}</h1>
          </div>

          <div className="po-detail__meta-row">
            <span className="po-detail__meta-chip">{po.department}</span>
            <span className="po-detail__meta-date">{formatDate(po.date)}</span>
            {po.requires_ceo && (
              <span className="po-detail__ceo-flag">⚑ CEO Approval</span>
            )}
          </div>

          {po.description && (
            <p className="po-detail__description">{po.description}</p>
          )}

          <div className="po-detail__creator">
            <NavIcon name="user" size={13} />
            {/* ✅ Use joined profile name, not raw UUID */}
            <span>Created by <strong>{po.creator?.full_name ?? '—'}</strong></span>
          </div>
        </div>

        {/* ── Line items card ── */}
        <div className="po-detail__card">
          <span className="po-detail__section-label">Line Items</span>
          <div className="po-detail__items">
            {po.line_items?.map((item) => (
              <div key={item.id} className="po-detail__item">
                <span className="po-detail__item-desc">{item.description}</span>
                <span className="po-detail__item-price mono">
                  {formatCurrency(item.price)}
                </span>
              </div>
            ))}
          </div>
          <div className="po-detail__total-row">
            <span className="po-detail__total-label">Total</span>
            <span className="po-detail__total-value mono">
              {formatCurrency(po.total)}
            </span>
          </div>
        </div>

        {/* ── Tags card ── */}
        {po.tags?.length > 0 && (
          <div className="po-detail__card">
            <span className="po-detail__section-label">Tags</span>
            <div className="po-detail__tags">
              {po.tags.map((t) => (
                <Tag key={t.tag} label={t.tag} />
              ))}
            </div>
          </div>
        )}

        {/* ── Attachments card ── */}
        <div className="po-detail__card">
          <span className="po-detail__section-label">Attachments</span>
          {po.attachments?.length > 0 ? (
            <div className="po-detail__attachments">
              {po.attachments.map((att) => (
                <a
                  key={att.id}
                  href={att.file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="po-detail__attachment"
                >
                  <span className="po-detail__attachment-icon">
                    {fileIcon(att.file_type)}
                  </span>
                  <div className="po-detail__attachment-info">
                    <span className="po-detail__attachment-name">{att.file_name}</span>
                    <span className="po-detail__attachment-size mono">
                      {fmtFileSize(att.file_size)}
                    </span>
                  </div>
                  <span className="po-detail__attachment-arrow">↗</span>
                </a>
              ))}
            </div>
          ) : (
            <span className="po-detail__no-attachments">No attachments</span>
          )}
        </div>

        {/* ── Audit trail (Finance + CEO) ── */}
        {(isFinance || isCEO) && po.audit?.length > 0 && (
          <AuditTrail audit={po.audit} />
        )}

      </div>

      {/* ── CEO bottom action bar ── */}
      {isCEO && (
        <CEOActionBar
          status={po.status}
          onApprove={approvePO}
          onReject={rejectPO}
          acting={acting}
        />
      )}

      {/* ── Finance bottom action bar ── */}
      {isFinance && financeAction && (
        <div className="po-detail__action-bar">
          <button
            className="po-detail__action-btn po-detail__action-btn--approve"
            onClick={releasePO}
            disabled={acting}
          >
            {acting ? 'Saving…' : financeAction.label}
          </button>
        </div>
      )}

    </div>
  )
}