// src/features/mo/MoCreate.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import * as RadioGroup from '@radix-ui/react-radio-group';
import db from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import { S } from '@/lib/strings';
import { formatCurrency } from '@/lib/utils';
import { DEPARTMENTS } from '@/lib/constants';
import WizardShell from '@/components/form/WizardShell';
import TagInput from '@/components/form/TagInput';
import AttachmentsInput from '@/components/form/AttachmentsInput';
import './MoCreate.scss';

const EMPTY_FORM = {
  title: '',
  description: '',
  asset_id: '',
  department: '',
  service_provider: '',
  handler: '',
  requires_ceo: false,
  currency: 'USD',
  item_description: '',
  item_price: '',
  tags: [],
};

const TOTAL_STEPS = 4;
const MAX_ATTACHMENT_MB = 10;

const STEP_LABELS = [
  S.moStep1Label,
  S.moStep2Label,
  S.moStep3Label,
  S.moStep4Label,
];

export default function CreateMO() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [attachments, setAttachments] = useState([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const assets = useLiveQuery(
    () => db.assets.filter((a) => a.is_active).toArray().then((rows) =>
      rows.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'ar'))
    ),
    []
  ) ?? [];

  const filteredAssets = assetSearch
    ? assets.filter((a) =>
        a.name.toLowerCase().includes(assetSearch.toLowerCase()) ||
        a.plate_number?.toLowerCase().includes(assetSearch.toLowerCase())
      )
    : assets;

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const selectAsset = (asset) => {
    setSelectedAsset(asset);
    setForm((prev) => ({
      ...prev,
      asset_id: asset.id,
      department: asset.department ?? prev.department,
    }));
    setAssetPickerOpen(false);
    setAssetSearch('');
  };

  const addTag = (tag) => {
    setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
  };

  const removeTag = (tag) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const addAttachment = (file) => {
    setAttachments((prev) => [...prev, file]);
  };

  const removeAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const validateStep = () => {
    if (step === 1) {
      if (!form.title.trim()) { setError(S.moErrorTitle); return false; }
      if (!form.asset_id) { setError(S.moErrorAsset); return false; }
      if (!form.department) { setError(S.moErrorDept); return false; }
    }
    if (step === 2) {
      if (!form.item_description.trim()) { setError(S.moErrorItemDesc); return false; }
      if (!form.item_price || isNaN(Number(form.item_price)) || Number(form.item_price) <= 0) {
        setError(S.moErrorItemPrice);
        return false;
      }
    }
    setError(null);
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const prevStep = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      const { data: mo, error: moError } = await supabase
        .from('maintenance_orders')
        .insert({
          title: form.title.trim(),
          description: form.description.trim() || null,
          asset_id: form.asset_id,
          type: selectedAsset?.type ?? 'other',
          department: form.department,
          service_provider: form.service_provider.trim() || null,
          handler: form.handler.trim() || null,
          requires_ceo: form.requires_ceo,
          currency: form.currency,
          item_description: form.item_description.trim(),
          item_price: Number(form.item_price),
          status: 'draft',
          created_by: profile.id,
        })
        .select('id')
        .single();

      if (moError) throw moError;

      const moId = mo.id;

      if (form.tags.length > 0) {
        const tagRows = form.tags.map((tag) => ({ mo_id: moId, tag }));
        const { error: tagError } = await supabase.from('mo_tags').insert(tagRows);
        if (tagError) throw tagError;
      }

      for (const file of attachments) {
        const path = `mo/${moId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(path, file);
        if (uploadError) throw uploadError;

        const { error: attachError } = await supabase
          .from('mo_attachments')
          .insert({
            mo_id: moId,
            file_name: file.name,
            file_path: path,
            file_size: file.size,
            file_type: file.type,
          });
        if (attachError) throw attachError;
      }

      await supabase.from('audit_log').insert({
        entity_type: 'maintenance_order',
        entity_id: moId,
        action: 'created',
        performed_by: profile.id,
      });

      navigate(`/mo/${moId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const isFinalStep = step === TOTAL_STEPS;

  return (
    <WizardShell
      title={S.moCreateTitle}
      step={step}
      totalSteps={TOTAL_STEPS}
      stepLabels={STEP_LABELS}
      error={error}
      primary={{
        label: isFinalStep
          ? (saving ? S.saving : S.moSubmit)
          : S.moNext,
        onClick: isFinalStep ? handleSubmit : nextStep,
        disabled: isFinalStep ? saving : false,
      }}
      secondary={
        step > 1
          ? { label: S.moPrev, onClick: prevStep }
          : null
      }
    >
      {step === 1 && (
        <Step1
          form={form}
          set={set}
          assets={filteredAssets}
          selectedAsset={selectedAsset}
          assetSearch={assetSearch}
          setAssetSearch={setAssetSearch}
          assetPickerOpen={assetPickerOpen}
          setAssetPickerOpen={setAssetPickerOpen}
          selectAsset={selectAsset}
        />
      )}
      {step === 2 && (
        <Step2
          form={form}
          set={set}
          setForm={setForm}
          addTag={addTag}
          removeTag={removeTag}
        />
      )}
      {step === 3 && (
        <Step3
          attachments={attachments}
          addAttachment={addAttachment}
          removeAttachment={removeAttachment}
        />
      )}
      {step === 4 && (
        <Step4
          form={form}
          selectedAsset={selectedAsset}
          attachments={attachments}
        />
      )}
    </WizardShell>
  );
}

// ─── Step 1: Details ─────────────────────────────────────────────────────────

function Step1({ form, set, assets, selectedAsset, assetSearch, setAssetSearch, assetPickerOpen, setAssetPickerOpen, selectAsset }) {
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

      {/* Asset picker — MO-specific, stays bespoke */}
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
                assets.map((a) => (
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
          onClick={() => set('requires_ceo')({ target: { value: !form.requires_ceo } })}
          aria-pressed={form.requires_ceo}
        >
          <span className="toggle__knob" />
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Cost & Tags ──────────────────────────────────────────────────────

function Step2({ form, set, setForm, addTag, removeTag }) {
  return (
    <div className="form">
      <Field label={S.moCurrency}>
        <RadioGroup.Root
          className="currency-radio"
          value={form.currency}
          onValueChange={(val) => setForm((prev) => ({ ...prev, currency: val }))}
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
          type="number"
          min="0"
          step="0.01"
          value={form.item_price}
          onChange={set('item_price')}
          placeholder="0.00"
          dir="ltr"
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
  );
}

// ─── Step 3: Attachments ──────────────────────────────────────────────────────

function Step3({ attachments, addAttachment, removeAttachment }) {
  return (
    <div className="form">
      <AttachmentsInput
        files={attachments}
        onAdd={addAttachment}
        onRemove={removeAttachment}
        maxSizeMB={MAX_ATTACHMENT_MB}
        hint={S.moAttachmentOptional}
      />
    </div>
  );
}

// ─── Step 4: Review ───────────────────────────────────────────────────────────

function Step4({ form, selectedAsset, attachments }) {
  return (
    <div className="form">
      <div className="create-mo__review-card">
        <ReviewRow label={S.moTitle} value={form.title} />
        {form.description && <ReviewRow label={S.moDescription} value={form.description} />}
        <ReviewRow label={S.moAsset} value={selectedAsset?.name ?? '—'} />
        <ReviewRow label={S.assetDepartment} value={form.department} />
        {form.service_provider && <ReviewRow label={S.moServiceProvider} value={form.service_provider} />}
        {form.handler && <ReviewRow label={S.moHandler} value={form.handler} />}
        <ReviewRow
          label={S.requiresCEO}
          value={form.requires_ceo ? 'نعم' : 'لا'}
        />
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
        {attachments.length > 0 && (
          <ReviewRow
            label={S.moAttachments}
            value={`${attachments.length} ${S.moAttachmentCount}`}
          />
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value, mono }) {
  return (
    <div className="create-mo__review-cell">
      <div className="review__row">
        <span className="review__label">{label}</span>
        <span className={`review__value${mono ? ' mono' : ''}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="field">
      <label className="field__label">{label}</label>
      {children}
    </div>
  );
}