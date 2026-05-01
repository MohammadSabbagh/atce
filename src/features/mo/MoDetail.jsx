// src/features/mo/MODetail.jsx

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { useMODetail } from './hooks/useMODetail'
import StatusBadge from '@/components/ui/StatusBadge'
import Tag from '@/components/ui/Tag'
import NavIcon from '@/components/layout/NavIcon'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getAvailableTransitions } from '@/lib/moStatusConfig'
import { S } from '@/lib/strings'
import './MODetail.scss'

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
    created:   'تم الإنشاء',
    confirmed: 'تم التأكيد والإحالة',
    approved:  'تم الاعتماد',
    rejected:  'تم الرفض',
    released:  'تم الإصدار',
    cancelled: 'تم الإلغاء',
  }
  return map[action] ?? action
}

const typeLabel = (type) => type === 'car' ? S.assetTypeCarWithIcon : S.assetTypeOtherWithIcon

// ─── Sub-components ───────────────────────────────────────────────────────────
function AuditTrail({ audit }) {
  if (!audit?.length) return null
  return (
    <div className="mo-detail__card">
      <span className="mo-detail__section-label">سجل المعاملات</span>
      <div className="mo-detail__audit">
        {audit.map((entry, i) => (
          <div key={entry.id ?? i} className="mo-detail__audit-item">
            <div className="mo-detail__audit-dot-col">
              <div className={`mo-detail__audit-dot mo-detail__audit-dot--${entry.action}`} />
              {i < audit.length - 1 && <div className="mo-detail__audit-line" />}
            </div>
            <div className="mo-detail__audit-body">
              <span className="mo-detail__audit-action">{auditLabel(entry.action)}</span>
              <span className="mo-detail__audit-by">{entry.actor?.full_name ?? '—'}</span>
              <span className="mo-detail__audit-time">{fmtDateTime(entry.created_at)}</span>
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
    <div className="mo-detail__dialog-backdrop" onClick={onCancel}>
      <div className="mo-detail__dialog" onClick={e => e.stopPropagation()}>
        <div className="mo-detail__dialog-header">
          <span className="mo-detail__dialog-title">سبب الرفض</span>
          <button className="mo-detail__dialog-close" onClick={onCancel}>×</button>
        </div>
        <textarea
          className="mo-detail__dialog-textarea"
          placeholder="سبب الرفض (اختياري)"
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={4}
          autoFocus
        />
        <div className="mo-detail__dialog-actions">
          <button
            className="mo-detail__action-btn mo-detail__action-btn--ghost"
            onClick={onCancel}
            disabled={acting}
          >
            إلغاء
          </button>
          <button
            className="mo-detail__action-btn mo-detail__action-btn--reject"
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

function CancelDialog({ onConfirm, onCancel, acting }) {
  const [note, setNote] = useState('')
  return (
    <div className="mo-detail__dialog-backdrop" onClick={onCancel}>
      <div className="mo-detail__dialog" onClick={e => e.stopPropagation()}>
        <div className="mo-detail__dialog-header">
          <span className="mo-detail__dialog-title">إلغاء أمر الصيانة</span>
          <button className="mo-detail__dialog-close" onClick={onCancel}>×</button>
        </div>
        <textarea
          className="mo-detail__dialog-textarea"
          placeholder="سبب الإلغاء (اختياري)"
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={4}
          autoFocus
        />
        <div className="mo-detail__dialog-actions">
          <button
            className="mo-detail__action-btn mo-detail__action-btn--ghost"
            onClick={onCancel}
            disabled={acting}
          >
            تراجع
          </button>
          <button
            className="mo-detail__action-btn mo-detail__action-btn--reject"
            onClick={() => onConfirm(note)}
            disabled={acting}
          >
            {acting ? 'جارٍ الحفظ…' : 'تأكيد الإلغاء'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PMActionBar({ canConfirm, canCancel, onConfirm, onCancel, acting }) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  if (!canConfirm && !canCancel) return null

  return (
    <>
      <div className="mo-detail__action-bar">
        {canConfirm && (
          <button
            className="mo-detail__action-btn mo-detail__action-btn--approve"
            onClick={onConfirm}
            disabled={acting}
          >
            {acting ? 'جارٍ الحفظ…' : 'تأكيد وإحالة'}
          </button>
        )}
        {canCancel && (
          <button
            className="mo-detail__action-btn mo-detail__action-btn--ghost"
            onClick={() => setCancelDialogOpen(true)}
            disabled={acting}
          >
            إلغاء الأمر
          </button>
        )}
      </div>
      {cancelDialogOpen && (
        <CancelDialog
          onConfirm={(note) => { setCancelDialogOpen(false); onCancel(note) }}
          onCancel={() => setCancelDialogOpen(false)}
          acting={acting}
        />
      )}
    </>
  )
}

function CEOActionBar({ status, onApprove, onReject, acting }) {
  const [dialogOpen, setDialogOpen] = useState(false)

  if (status === 'approved' || status === 'released') {
    return (
      <div className="mo-detail__action-bar">
        <div className="mo-detail__decided mo-detail__decided--approved">✓ تم الاعتماد</div>
      </div>
    )
  }
  if (status === 'rejected') {
    return (
      <div className="mo-detail__action-bar">
        <div className="mo-detail__decided mo-detail__decided--rejected">✕ تم الرفض</div>
      </div>
    )
  }
  return (
    <>
      <div className="mo-detail__action-bar">
        <button
          className="mo-detail__action-btn mo-detail__action-btn--approve"
          onClick={onApprove}
          disabled={acting}
        >
          {acting ? 'جارٍ الحفظ…' : 'اعتماد'}
        </button>
        <button
          className="mo-detail__action-btn mo-detail__action-btn--reject"
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
      <div className="mo-detail__action-bar">
        {canRelease && (
          <button
            className="mo-detail__action-btn mo-detail__action-btn--approve"
            onClick={onRelease}
            disabled={acting}
          >
            {acting ? 'جارٍ الحفظ…' : 'إصدار'}
          </button>
        )}
        {canReject && (
          <button
            className="mo-detail__action-btn mo-detail__action-btn--reject"
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
    <div className="mo-detail__card">
      <span className="mo-detail__section-label">الملاحظات</span>
      <div className="mo-detail__notes-list">
        {notes.map((n) => (
          <div
            key={n.id}
            className={`mo-detail__note-bubble mo-detail__note-bubble--${n.context}`}
          >
            <div className="mo-detail__note-header">
              <span className="mo-detail__note-author">{n.author?.full_name ?? '—'}</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {contextLabel(n.context) && (
                  <span className="mo-detail__note-context">{contextLabel(n.context)}</span>
                )}
                <span className="mo-detail__note-time">{fmtNoteTime(n.created_at)}</span>
              </div>
            </div>
            <p className="mo-detail__note-text">{n.note}</p>
          </div>
        ))}
      </div>
      <div className="mo-detail__note-input-row">
        <textarea
          className="mo-detail__note-textarea"
          placeholder="أضف ملاحظة..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className="mo-detail__note-send"
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
export default function MODetail() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const role = profile?.role

  const {
    mo, loading, error, acting,
    approveMO, rejectMO, releaseMO, cancelMO, confirmMO, addNote,
  } = useMODetail()

  const currency = mo?.currency ?? 'USD'

  const isCEO     = role === 'ceo'
  const isFinance = role === 'finance'
  const isPM      = role === 'purchase_manager'

  const transitions = mo ? getAvailableTransitions(mo, role, profile?.id) : []
  const canRelease  = transitions.includes('finance_release_from_approved')
                   || transitions.includes('finance_release_from_pending')
  const canReject   = transitions.includes('finance_reject')
  const canConfirm  = transitions.includes('pm_confirm')
  const canCancel   = transitions.includes('cancel') || transitions.includes('cancel_draft')

  if (loading) {
    return (
      <div className="mo-detail">
        <div className="mo-detail__loading">جارٍ التحميل…</div>
      </div>
    )
  }

  if (error || !mo) {
    return (
      <div className="mo-detail">
        <div className="mo-detail__not-found">
          <span style={{ fontSize: 32 }}>🔍</span>
          <p>{error ?? 'لم يتم العثور على أمر الصيانة.'}</p>
          <button onClick={() => navigate(-1)} className="mo-detail__back-link">
            → رجوع
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mo-detail">

      {/* ── Sticky header ── */}
      <div className="mo-detail__header">
        <button className="mo-detail__back" onClick={() => navigate(-1)}>
          <NavIcon name="chevron-right" size={16} />
        </button>
        <span className="mo-detail__mo-number mono">{mo.mo_number}</span>
        <StatusBadge status={mo.status} />
      </div>

      <div className="mo-detail__content">

        {/* ── Overview card ── */}
        <div className="mo-detail__card">
          <div className="mo-detail__overview-top">
            <h1 className="mo-detail__title">{mo.title}</h1>
          </div>

          <div className="mo-detail__meta-row">
            <span className="mo-detail__meta-date">{formatDate(mo.created_at)}</span>
            {mo.requires_ceo && (
              <span className="mo-detail__ceo-flag">⚑ موافقة المدير العام</span>
            )}
            <span className="mo-detail__meta-chip">{mo.department}</span>
            <span className="mo-detail__type-chip mo-detail__type-chip--{mo.type}">
              {typeLabel(mo.type)}
            </span>
          </div>

          {mo.description && (
            <p className="mo-detail__description">{mo.description}</p>
          )}

          {/* Asset link */}
          {mo.asset && (
            <button
              className="mo-detail__asset-link"
              onClick={() => navigate(`/assets/${mo.asset.id}`)}
            >
              <span className="mo-detail__asset-link-label">الأصل</span>
              <span className="mo-detail__asset-link-name">{mo.asset.name}</span>
              {mo.asset.plate_number && (
                <span className="mo-detail__asset-link-plate mono">{mo.asset.plate_number}</span>
              )}
              <span className="mo-detail__asset-link-arrow">↗</span>
            </button>
          )}

          {/* Service provider + handler */}
          <div className="mo-detail__field-row">
            {mo.service_provider && (
              <div className="mo-detail__field">
                <span className="mo-detail__field-label">مزود الخدمة</span>
                <span className="mo-detail__field-value">{mo.service_provider}</span>
              </div>
            )}
            {mo.handler && (
              <div className="mo-detail__field">
                <span className="mo-detail__field-label">المسؤول</span>
                <span className="mo-detail__field-value">{mo.handler}</span>
              </div>
            )}
          </div>

          <div className="mo-detail__creator">
            <NavIcon name="user" size={13} />
            <span>أنشئ بواسطة <strong>{mo.creator?.full_name ?? '—'}</strong></span>
          </div>
        </div>

        {/* ── Cost card ── */}
        <div className="mo-detail__card">
          <span className="mo-detail__section-label">تفاصيل التكلفة</span>
          <div className="mo-detail__cost-item">
            <span className="mo-detail__cost-desc">{mo.item_description}</span>
            <span className="mo-detail__cost-amount mono">
              {formatCurrency(mo.item_price, currency)}
            </span>
          </div>
          <div className="mo-detail__total-row">
            <span className="mo-detail__total-label">الإجمالي</span>
            <span className="mo-detail__total-value mono">
              {formatCurrency(mo.item_price, currency)}
            </span>
          </div>
        </div>

        {/* ── Tags card ── */}
        {mo.tags?.length > 0 && (
          <div className="mo-detail__card">
            <span className="mo-detail__section-label">الوسوم</span>
            <div className="mo-detail__tags">
              {mo.tags.map((t) => (
                <Tag key={t.tag} label={t.tag} />
              ))}
            </div>
          </div>
        )}

        {/* ── Attachments card ── */}
        <div className="mo-detail__card">
          <span className="mo-detail__section-label">المرفقات</span>
          {mo.attachments?.length > 0 ? (
            <div className="mo-detail__attachments">
              {mo.attachments.map((att) => (
                <div
                  key={att.id}
                  className="mo-detail__attachment"
                  onClick={() => att.url && window.open(att.url, '_blank', 'noopener,noreferrer')}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="mo-detail__attachment-icon">{fileIcon(att.file_type)}</span>
                  <div className="mo-detail__attachment-info">
                    <span className="mo-detail__attachment-name">{att.file_name}</span>
                    <span className="mo-detail__attachment-size mono">{fmtFileSize(att.file_size)}</span>
                  </div>
                  <span className="mo-detail__attachment-arrow">↗</span>
                </div>
              ))}
            </div>
          ) : (
            <span className="mo-detail__no-attachments">لا توجد مرفقات</span>
          )}
        </div>

        {/* ── Audit trail ── */}
        <AuditTrail audit={mo.audit} />

        {/* ── Notes ── */}
        <NotesSection
          notes={mo.notes ?? []}
          onAdd={addNote}
          acting={acting}
        />

      </div>

      {/* ── CEO bottom action bar ── */}
      {isCEO && mo.requires_ceo && (
        <CEOActionBar
          status={mo.status}
          onApprove={approveMO}
          onReject={rejectMO}
          acting={acting}
        />
      )}

      {/* ── Finance bottom action bar ── */}
      {isFinance && (canRelease || canReject) && (
        <FinanceActionBar
          canRelease={canRelease}
          canReject={canReject}
          onRelease={releaseMO}
          onReject={rejectMO}
          acting={acting}
        />
      )}

      {/* ── PM bottom action bar ── */}
      {isPM && (canConfirm || canCancel) && (
        <PMActionBar
          canConfirm={canConfirm}
          canCancel={canCancel}
          onConfirm={confirmMO}
          onCancel={cancelMO}
          acting={acting}
        />
      )}

    </div>
  )
}