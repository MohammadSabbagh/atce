// features/po/PODetail.jsx

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { usePODetail } from './hooks/usePODetail'
import StatusBadge from '@/components/ui/StatusBadge'
import Tag from '@/components/ui/Tag'
import NavIcon from '@/components/layout/NavIcon'
import { formatCurrency, formatDate } from '@/lib/utils'
import '@/styles/po-detail.scss'
import { getAvailableTransitions } from '@/lib/poStatusConfig'

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
    created:     'تم الإنشاء',
    submitted:   'تم التقديم',
    approved:    'تم الاعتماد',
    rejected:    'تم الرفض',
    released:    'تم الإصدار',
    confirmed:   'تم التأكيد والإحالة',
    cancelled:   'تم الإلغاء',
    fulfilled:   'تم التنفيذ',
  }
  return map[action] ?? action
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function AuditTrail({ audit }) {
  if (!audit?.length) return null

  return (
    <div className="po-detail__card">
      <span className="po-detail__section-label">سجل المعاملات</span>
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
                {entry.actor?.full_name ?? '—'}
              </span>
              <span className="po-detail__audit-time">{fmtDateTime(entry.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RejectDialog({ onConfirm, onCancel, acting }) {
  const [note, setNote] = useState('')
  return (
    <div className="po-detail__dialog-backdrop" onClick={onCancel}>
      <div className="po-detail__dialog" onClick={e => e.stopPropagation()}>
        <div className="po-detail__dialog-header">
          <span className="po-detail__dialog-title">سبب الرفض</span>
          <button className="po-detail__dialog-close" onClick={onCancel}>×</button>
        </div>
        <textarea
          className="po-detail__dialog-textarea"
          placeholder="سبب الرفض (اختياري)"
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={4}
          autoFocus
        />
        <div className="po-detail__dialog-actions">
          <button
            className="po-detail__action-btn po-detail__action-btn--ghost"
            onClick={onCancel}
            disabled={acting}
          >
            إلغاء
          </button>
          <button
            className="po-detail__action-btn po-detail__action-btn--reject"
            onClick={() => onConfirm(note)}
            disabled={acting}
          >
            {acting ? 'جارٍ الحفظ…' : 'تأكيد الرفض'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PMActionBar({ canConfirm, canCancel, onConfirm, onCancel, acting }) {
  if (!canConfirm && !canCancel) return null

  return (
    <div className="po-detail__action-bar">
      {canConfirm && (
        <button
          className="po-detail__action-btn po-detail__action-btn--approve"
          onClick={onConfirm}
          disabled={acting}
        >
          {acting ? 'جارٍ الحفظ…' : 'تأكيد وإحالة'}
        </button>
      )}
      {canCancel && (
        <button
          className="po-detail__action-btn po-detail__action-btn--ghost"
          onClick={onCancel}
          disabled={acting}
        >
          إلغاء الطلب
        </button>
      )}
    </div>
  )
}

function CEOActionBar({ status, onApprove, onReject, acting }) {
  const [dialogOpen, setDialogOpen] = useState(false)

  if (status === 'approved' || status === 'released') {
    return (
      <div className="po-detail__action-bar">
        <div className="po-detail__decided po-detail__decided--approved">✓ تم الاعتماد</div>
      </div>
    )
  }
  if (status === 'rejected') {
    return (
      <div className="po-detail__action-bar">
        <div className="po-detail__decided po-detail__decided--rejected">✕ تم الرفض</div>
      </div>
    )
  }
  return (
    <>
      <div className="po-detail__action-bar">
        <button
          className="po-detail__action-btn po-detail__action-btn--approve"
          onClick={onApprove}
          disabled={acting}
        >
          {acting ? 'جارٍ الحفظ…' : 'اعتماد'}
        </button>
        <button
          className="po-detail__action-btn po-detail__action-btn--reject"
          onClick={() => setDialogOpen(true)}
          disabled={acting}
        >
          رفض
        </button>
      </div>
      {dialogOpen && (
        <RejectDialog
          onConfirm={(note) => { setDialogOpen(false); onReject(note) }}
          onCancel={() => setDialogOpen(false)}
          acting={acting}
        />
      )}
    </>
  )
}

function FinanceActionBar({ canRelease, canReject, onRelease, onReject, acting }) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <div className="po-detail__action-bar">
        {canRelease && (
          <button
            className="po-detail__action-btn po-detail__action-btn--approve"
            onClick={onRelease}
            disabled={acting}
          >
            {acting ? 'جارٍ الحفظ…' : 'إصدار'}
          </button>
        )}
        {canReject && (
          <button
            className="po-detail__action-btn po-detail__action-btn--reject"
            onClick={() => setDialogOpen(true)}
            disabled={acting}
          >
            رفض
          </button>
        )}
      </div>
      {dialogOpen && (
        <RejectDialog
          onConfirm={(note) => { setDialogOpen(false); onReject(note) }}
          onCancel={() => setDialogOpen(false)}
          acting={acting}
        />
      )}
    </>
  )
}

function NotesSection({ notes = [], onAdd, acting }) {
  const [text, setText] = useState('')

  const contextLabel = (ctx) => {
    if (ctx === 'rejection')    return 'رفض'
    if (ctx === 'resubmission') return 'إعادة تقديم'
    if (ctx === 'cancellation') return 'إلغاء'
    return null
  }

  const fmtNoteTime = (iso) =>
    new Date(iso).toLocaleString('ar-SA', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  const handleSend = () => {
    if (!text.trim()) return
    onAdd(text)
    setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend()
  }

  return (
    <div className="po-detail__card">
      <span className="po-detail__section-label">الملاحظات</span>

      <div className="po-detail__notes-list">
        {notes.map((n) => (
          <div
            key={n.id}
            className={`po-detail__note-bubble po-detail__note-bubble--${n.context}`}
          >
            <div className="po-detail__note-header">
              <span className="po-detail__note-author">
                {n.author?.full_name ?? '—'}
              </span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {contextLabel(n.context) && (
                  <span className="po-detail__note-context">
                    {contextLabel(n.context)}
                  </span>
                )}
                <span className="po-detail__note-time">
                  {fmtNoteTime(n.created_at)}
                </span>
              </div>
            </div>
            <p className="po-detail__note-text">{n.note}</p>
          </div>
        ))}
      </div>

      <div className="po-detail__note-input-row">
        <textarea
          className="po-detail__note-textarea"
          placeholder="أضف ملاحظة..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className="po-detail__note-send"
          onClick={handleSend}
          disabled={!text.trim() || acting}
          title="إرسال"
        >
          ↑
        </button>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PODetail() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const role = profile?.role

  const {
    po, loading, error, acting,
    approvePO, rejectPO, releasePO, cancelPO, confirmPO, addNote,
  } = usePODetail()

  const isCEO     = role === 'ceo'
  const isFinance = role === 'finance'
  const isPM      = role === 'purchase_manager'

  const transitions  = po ? getAvailableTransitions(po, role, profile?.id) : []
  const canRelease   = transitions.includes('finance_release_from_approved')
                    || transitions.includes('finance_release_from_pending')
  const canReject    = transitions.includes('finance_reject')
  const canConfirm   = transitions.includes('pm_confirm')
  const canCancel    = transitions.includes('cancel') || transitions.includes('cancel_draft')

  if (loading) {
    return (
      <div className="po-detail">
        <div className="po-detail__loading">جارٍ التحميل…</div>
      </div>
    )
  }

  if (error || !po) {
    return (
      <div className="po-detail">
        <div className="po-detail__not-found">
          <span style={{ fontSize: 32 }}>🔍</span>
          <p>{error ?? 'لم يتم العثور على طلب الشراء.'}</p>
          <button onClick={() => navigate(-1)} className="po-detail__back-link">
            → رجوع
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
        {/* <span className="po-detail__header-title">{po.title}</span> */}
        <span className="po-detail__po-number mono">{po.po_number}</span>
        <StatusBadge status={po.status} />
      </div>

      <div className="po-detail__content">

        {/* ── Overview card ── */}
        <div className="po-detail__card">
          <div className="po-detail__overview-top">
            <h1 className="po-detail__title">{po.title}</h1>
          </div>

          <div className="po-detail__meta-row">
            <span className="po-detail__meta-date">{formatDate(po.created_at)}</span>
            {po.requires_ceo && (
              <span className="po-detail__ceo-flag">⚑ موافقة المدير العام</span>
            )}

            {[...new Set(po.line_items?.map(i => i.department).filter(Boolean) ?? [])].map(dept => (
              <span key={dept} className="po-detail__meta-chip">{dept}</span>
            ))}
          </div>

          {po.description && (
            <p className="po-detail__description">{po.description}</p>
          )}

          <div className="po-detail__creator">
            <NavIcon name="user" size={13} />
            <span>أنشئ بواسطة <strong>{po.creator?.full_name ?? '—'}</strong></span>
          </div>
        </div>

        {/* ── Line items card ── */}
        <div className="po-detail__card">
          <span className="po-detail__section-label">بنود الطلب</span>
          <div className="po-detail__items">
            {po.line_items?.map((item) => {
              const qty      = parseFloat(item.quantity)   || 0
              const price    = parseFloat(item.unit_price) || 0
              const subtotal = qty * price
              return (
                <div key={item.id} className="po-detail__item">
                  <div className="po-detail__item-main">
                    <span className="po-detail__item-desc">{item.description}</span>
                    <span className="po-detail__item-total mono">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="po-detail__item-sub">
                    <span className="po-detail__item-dept">{item.department}</span>
                    <span className="po-detail__item-breakdown mono">
                      {`${qty} × ${formatCurrency(price)}`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="po-detail__total-row">
            <span className="po-detail__total-label">الإجمالي</span>
            <span className="po-detail__total-value mono">
              {formatCurrency(po.total)}
            </span>
          </div>
        </div>

        {/* ── Tags card ── */}
        {po.tags?.length > 0 && (
          <div className="po-detail__card">
            <span className="po-detail__section-label">الوسوم</span>
            <div className="po-detail__tags">
              {po.tags.map((t) => (
                <Tag key={t.tag} label={t.tag} />
              ))}
            </div>
          </div>
        )}

        {/* ── Attachments card ── */}
        <div className="po-detail__card">
          <span className="po-detail__section-label">المرفقات</span>
          {po.attachments?.length > 0 ? (
            <div className="po-detail__attachments">
              {po.attachments.map((att) => (                
 <div
 key={att.id}
 className="po-detail__attachment"
 onClick={() => att.url && window.open(att.url, '_blank', 'noopener,noreferrer')}
 style={{ cursor: 'pointer' }}
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
</div>
              ))}
            </div>
          ) : (
            <span className="po-detail__no-attachments">لا توجد مرفقات</span>
          )}
        </div>

        {/* ── Audit trail — all roles ── */}
        <AuditTrail audit={po.audit} />

        {/* ── Notes ── */}
        <NotesSection
          notes={po.notes ?? []}
          onAdd={addNote}
          acting={acting}
        />

      </div>

      {/* ── CEO bottom action bar ── */}
      {isCEO && po.requires_ceo && (
        <CEOActionBar
          status={po.status}
          onApprove={approvePO}
          onReject={rejectPO}
          acting={acting}
        />
      )}

      {/* ── Finance bottom action bar ── */}
      {isFinance && (canRelease || canReject) && (
        <FinanceActionBar
          canRelease={canRelease}
          canReject={canReject}
          onRelease={releasePO}
          onReject={rejectPO}
          acting={acting}
        />
      )}

      {/* ── PM bottom action bar ── */}
      {isPM && (canConfirm || canCancel) && (
        <PMActionBar
          canConfirm={canConfirm}
          canCancel={canCancel}
          onConfirm={confirmPO}
          onCancel={cancelPO}
          acting={acting}
        />
      )}

    </div>
  )
}