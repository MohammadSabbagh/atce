// src/features/mo/MOEdit.jsx

import { useNavigate } from 'react-router-dom'
import * as RadioGroup from '@radix-ui/react-radio-group'
import { useMOEdit } from './useMOEdit'
import { S } from '@/lib/strings'
import { formatCurrency } from '@/lib/utils'
import { DEPARTMENTS } from '@/lib/constants'
import WizardShell from '@/components/form/WizardShell'
import TagInput from '@/components/form/TagInput'
import AttachmentsInput from '@/components/form/AttachmentsInput'
import { sanitizeDecimalInput } from '@/lib/utils'
import './MoCreate.scss'

const TOTAL_STEPS = 4
const MAX_ATTACHMENT_MB = 10

const STEP_LABELS = [
  S.moStep1Label,
  S.moStep2Label,
  S.moStep3Label,
  S.moStep4Label,
]

const fmtFileSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const fileIcon = (type) => {
  if (type === 'application/pdf') return '📄'
  if (type?.startsWith('image/')) return '🖼️'
  return '📎'
}

export default function MOEdit() {
  const w = useMOEdit()

  if (w.loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
        جارٍ التحميل…
      </div>
    )
  }

  if (w.loadError) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
        {w.loadError}
      </div>
    )
  }

  if (w.submitted) {
    return <EditSuccess onDone={w.handleDone} />
  }

  const isFinalStep = w.step === TOTAL_STEPS

  return (
    <WizardShell
      title={S.moEditTitle ?? 'تعديل أمر الصيانة'}
      step={w.step}
      totalSteps={TOTAL_STEPS}
      stepLabels={STEP_LABELS}
      error={w.error}
      primary={{
        label: isFinalStep
          ? (w.saving ? S.saving : S.moSaveEdit ?? 'حفظ التعديلات')
          : S.moNext,
        onClick: isFinalStep ? w.handleSubmit : w.nextStep,
        disabled: isFinalStep ? w.saving : false,
      }}
      secondary={
        w.step > 1
          ? { label: S.moPrev, onClick: w.prevStep }
          : null
      }
    >
      {w.step === 1 && <Step1 w={w} />}
      {w.step === 2 && <Step2 w={w} />}
      {w.step === 3 && <Step3 w={w} />}
      {w.step === 4 && <Step4 w={w} />}
    </WizardShell>
  )
}

// ─── Step 1: Details ─────────────────────────────────────────────────────────
function Step1({ w }) {
  const { form, set, selectedAsset, filteredAssets, assets,
          assetSearch, setAssetSearch, assetPickerOpen, setAssetPickerOpen, selectAsset } = w

  return (
    <div className="form">
      <Field label={`${S.moTitle} *`}>
        <input
          className="input"
          type="text"
          value={form.title}
          onChange={set('title')}
          placeholder={S.moTitlePlaceholder}
          dir="rtl"
        />
      </Field>

      <Field label={S.moDescription}>
        <textarea
          className="textarea"
          value={form.description}
          onChange={set('description')}
          placeholder={S.moDescPlaceholder}
          rows={2}
          dir="rtl"
        />
      </Field>

      <Field label={`${S.moAsset} *`}>
        <div className="create-mo__asset-picker">
          {selectedAsset ? (
            <div className="create-mo__asset-selected" onClick={() => setAssetPickerOpen(true)}>
              <span className="create-mo__asset-name">{selectedAsset.name}</span>
              {selectedAsset.plate_number && (
                <span className="create-mo__asset-plate">{selectedAsset.plate_number}</span>
              )}
              <span className="create-mo__asset-change">{S.moChangeAsset}</span>
            </div>
          ) : (
            <button
              className="create-mo__asset-btn"
              type="button"
              onClick={() => setAssetPickerOpen(true)}
            >
              {S.moSelectAsset}
            </button>
          )}
        </div>

        {assetPickerOpen && (
          <div className="create-mo__asset-dropdown">
            <input
              className="create-mo__asset-search"
              type="text"
              value={assetSearch}
              onChange={(e) => setAssetSearch(e.target.value)}
              placeholder={S.assetsSearchPlaceholder}
              dir="rtl"
              autoFocus
            />
            <div className="create-mo__asset-list">
              {assets.length === 0 ? (
                <p className="create-mo__asset-empty">{S.assetsEmpty}</p>
              ) : (
                filteredAssets.map((a) => (
                  <div
                    key={a.id}
                    className="create-mo__asset-option"
                    onClick={() => selectAsset(a)}
                  >
                    <span className="create-mo__asset-option-name">{a.name}</span>
                    <div className="create-mo__asset-option-meta">
                      <span className={`create-mo__asset-option-type create-mo__asset-option-type--${a.type}`}>
                        {a.type === 'car' ? S.assetTypeCar : S.assetTypeOther}
                      </span>
                      {a.plate_number && (
                        <span className="create-mo__asset-option-plate">{a.plate_number}</span>
                      )}
                      <span className="create-mo__asset-option-dept">{a.department}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Field>

      <Field label={`${S.assetDepartment} *`}>
        <select
          className="input input--select"
          value={form.department}
          onChange={set('department')}
          dir="rtl"
        >
          <option value="">{S.assetDeptPlaceholder}</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </Field>

      <Field label={S.moServiceProvider}>
        <input
          className="input"
          type="text"
          value={form.service_provider}
          onChange={set('service_provider')}
          placeholder={S.moServiceProviderPlaceholder}
          dir="rtl"
        />
      </Field>

      <Field label={S.moHandler}>
        <input
          className="input"
          type="text"
          value={form.handler}
          onChange={set('handler')}
          placeholder={S.moHandlerPlaceholder}
          dir="rtl"
        />
      </Field>

      <div className="form__toggle-row">
        <div className="form__toggle-label">
          <span className="form__toggle-label-text">{S.requiresCEO}</span>
        </div>
        <button
          type="button"
          className="toggle"
          data-state={form.requires_ceo ? 'on' : 'off'}
          onClick={() => w.setField('requires_ceo', !form.requires_ceo)}
          aria-pressed={form.requires_ceo}
        >
          <span className="toggle__knob" />
        </button>
      </div>
    </div>
  )
}

// ─── Step 2: Cost & Tags ──────────────────────────────────────────────────────
function Step2({ w }) {
  const { form, set, setPrice, setField, addTag, removeTag } = w

  return (
    <div className="form">
      <Field label={S.moCurrency}>
        <RadioGroup.Root
          className="currency-radio"
          value={form.currency}
          onValueChange={(val) => setField('currency', val)}
          dir="rtl"
        >
          <RadioGroup.Item value="SYP" className="currency-radio__item">
            <RadioGroup.Indicator className="currency-radio__indicator" />
            <div className="currency-radio__content">
              <span className="currency-radio__symbol">ل.س</span>
              <span className="currency-radio__label">{S.currencyLS}</span>
            </div>
          </RadioGroup.Item>

          <RadioGroup.Item value="USD" className="currency-radio__item">
            <RadioGroup.Indicator className="currency-radio__indicator" />
            <div className="currency-radio__content">
              <span className="currency-radio__symbol">$</span>
              <span className="currency-radio__label">{S.currencyUSD}</span>
            </div>
          </RadioGroup.Item>
        </RadioGroup.Root>
      </Field>

      <Field label={`${S.moItemDescription} *`}>
        <input
          className="input"
          type="text"
          value={form.item_description}
          onChange={set('item_description')}
          placeholder={S.moItemDescPlaceholder}
          dir="rtl"
        />
      </Field>

      <Field label={`${S.moItemPrice} *`}>
        <input
          className="input input--mono"
          type="text"
          inputMode="decimal"
          value={form.item_price}
          onChange={(e) => setPrice(sanitizeDecimalInput(e.target.value))}
          placeholder="0.00"
        />
      </Field>

      <Field label={S.moTags}>
        <TagInput
          tags={form.tags}
          onAdd={addTag}
          onRemove={removeTag}
          placeholder={S.moTagPlaceholder}
        />
      </Field>
    </div>
  )
}

// ─── Step 3: Attachments ──────────────────────────────────────────────────────
function Step3({ w }) {
  const { attachments, addAttachment, removeAttachment, existingAttachments, markExistingForDeletion } = w

  return (
    <div className="form">

      {/* Existing attachments */}
      {existingAttachments?.length > 0 && (
        <div className="form__existing-attachments">
          <p className="form__section-label">
            {S.attachExisting ?? 'المرفقات الحالية'}
          </p>
          <div className="form__file-list">
            {existingAttachments.map((att) => (
              <div key={att.id} className="form__file-item">
                <div className="form__file-info">
                  <span className="form__file-icon">{fileIcon(att.file_type)}</span>
                  <div>
                    <p className="form__file-name">{att.file_name}</p>
                    <p className="form__file-size">{fmtFileSize(att.file_size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="form__file-remove"
                  onClick={() => markExistingForDeletion(att)}
                  aria-label="إزالة"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New file upload */}
      <AttachmentsInput
        files={attachments}
        onAdd={addAttachment}
        onRemove={removeAttachment}
        maxSizeMB={MAX_ATTACHMENT_MB}
        hint={`إضافة مرفقات جديدة (PDF أو صورة، حد أقصى ${MAX_ATTACHMENT_MB} ميغابايت)`}
      />
    </div>
  )
}

// ─── Step 4: Review ───────────────────────────────────────────────────────────
function Step4({ w }) {
  const { form, selectedAsset, attachments, existingAttachments } = w
  const totalAttachments = (existingAttachments?.length ?? 0) + attachments.length

  return (
    <div className="form">
      <div className="create-mo__review-card">
        <ReviewRow label={S.moTitle} value={form.title} />
        {form.description && <ReviewRow label={S.moDescription} value={form.description} />}
        <ReviewRow label={S.moAsset} value={selectedAsset?.name ?? '—'} />
        <ReviewRow label={S.assetDepartment} value={form.department} />
        {form.service_provider && <ReviewRow label={S.moServiceProvider} value={form.service_provider} />}
        {form.handler && <ReviewRow label={S.moHandler} value={form.handler} />}
        <ReviewRow label={S.requiresCEO} value={form.requires_ceo ? 'نعم' : 'لا'} />
        <ReviewRow label={S.moItemDescription} value={form.item_description} />
        <ReviewRow
          label={S.moItemPrice}
          value={formatCurrency(Number(form.item_price), form.currency)}
          mono
        />
        {form.tags.length > 0 && (
          <div className="create-mo__review-cell">
            <div className="review__row">
              <span className="review__label">{S.moTags}</span>
              <div className="review__tags">
                {form.tags.map((t) => (
                  <span key={t} className="create-mo__review-tag">{t}</span>
                ))}
              </div>
            </div>
          </div>
        )}
        {totalAttachments > 0 && (
          <ReviewRow
            label={S.moAttachments}
            value={`${totalAttachments} ${S.moAttachmentCount}`}
          />
        )}
      </div>
    </div>
  )
}

function EditSuccess({ onDone }) {
  return (
    <div className="submit-success">
      <div className="submit-success__icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h2 className="submit-success__title">تم الحفظ</h2>
      <p className="submit-success__subtitle">تم تحديث أمر الصيانة بنجاح.</p>
      <button className="btn btn--primary" onClick={onDone}>
        عرض الأمر
      </button>
    </div>
  )
}

function ReviewRow({ label, value, mono }) {
  return (
    <div className="create-mo__review-cell">
      <div className="review__row">
        <span className="review__label">{label}</span>
        <span className={`review__value${mono ? ' mono' : ''}`}>{value}</span>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="field">
      <label className="field__label">{label}</label>
      {children}
    </div>
  )
}