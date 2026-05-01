// src/features/mo/CreateMO.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import { S } from '@/lib/strings';
import { formatCurrency } from '@/lib/utils'
import { DEPARTMENTS } from '@/lib/constants';
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

export default function CreateMO() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [tagInput, setTagInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load assets from Dexie for picker
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

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag || form.tags.includes(tag)) return;
    setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    setTagInput('');
  };

  const removeTag = (tag) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag(); }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  // Step validation
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
      // Insert MO
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

      // Insert tags
      if (form.tags.length > 0) {
        const tagRows = form.tags.map((tag) => ({ mo_id: moId, tag }));
        const { error: tagError } = await supabase.from('mo_tags').insert(tagRows);
        if (tagError) throw tagError;
      }

      // Upload attachments
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

      // Audit log
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

  return (
    <div className="create-mo">
      {/* Header */}
      <div className="create-mo__topbar">
        <button className="create-mo__back" onClick={() => navigate(-1)}>
          {S.back}
        </button>
        <h1 className="create-mo__title">{S.moCreateTitle}</h1>
        <div style={{ width: 48 }} />
      </div>

      {/* Stepper */}
      <div className="create-mo__stepper">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`create-mo__step-dot${step > i ? ' create-mo__step-dot--done' : ''}${step === i + 1 ? ' create-mo__step-dot--active' : ''}`}
          />
        ))}
      </div>

      {/* Steps */}
      <div className="create-mo__body">
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
            tagInput={tagInput}
            setTagInput={setTagInput}
            addTag={addTag}
            removeTag={removeTag}
            handleTagKeyDown={handleTagKeyDown}
          />
        )}
        {step === 3 && (
          <Step3
            attachments={attachments}
            handleFileChange={handleFileChange}
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

        {error && <p className="create-mo__error">{error}</p>}
      </div>

      {/* Footer nav */}
      <div className="create-mo__footer">
        {step > 1 && (
          <button className="create-mo__prev-btn" onClick={prevStep}>
            {S.moPrev}
          </button>
        )}
        {step < TOTAL_STEPS ? (
          <button className="create-mo__next-btn" onClick={nextStep}>
            {S.moNext}
          </button>
        ) : (
          <button
            className="create-mo__submit-btn"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? S.saving : S.moSubmit}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step 1: Details ─────────────────────────────────────────────────────────

function Step1({ form, set, assets, selectedAsset, assetSearch, setAssetSearch, assetPickerOpen, setAssetPickerOpen, selectAsset }) {
  return (
    <div className="create-mo__step">
      <p className="create-mo__step-label">{S.moStep1Label}</p>

      <Field label={`${S.moTitle} *`}>
        <input
          className="create-mo__input"
          type="text"
          value={form.title}
          onChange={set('title')}
          placeholder={S.moTitlePlaceholder}
          dir="rtl"
        />
      </Field>

      <Field label={S.moDescription}>
        <textarea
          className="create-mo__textarea"
          value={form.description}
          onChange={set('description')}
          placeholder={S.moDescPlaceholder}
          rows={2}
          dir="rtl"
        />
      </Field>

      {/* Asset picker */}
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
                        {a.type === 'car' ? 'مركبة' : 'عام'}
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
          className="create-mo__select"
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
          className="create-mo__input"
          type="text"
          value={form.service_provider}
          onChange={set('service_provider')}
          placeholder={S.moServiceProviderPlaceholder}
          dir="rtl"
        />
      </Field>

      <Field label={S.moHandler}>
        <input
          className="create-mo__input"
          type="text"
          value={form.handler}
          onChange={set('handler')}
          placeholder={S.moHandlerPlaceholder}
          dir="rtl"
        />
      </Field>

      <div className="create-mo__toggle-row">
        <span className="create-mo__toggle-label">{S.requiresCEO}</span>
        <button
          type="button"
          className={`create-mo__toggle${form.requires_ceo ? ' create-mo__toggle--on' : ''}`}
          onClick={() => set('requires_ceo')({ target: { value: !form.requires_ceo } })}
        >
          <span className="create-mo__toggle-knob" />
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Cost & Tags ──────────────────────────────────────────────────────

function Step2({ form, set, tagInput, setTagInput, addTag, removeTag, handleTagKeyDown }) {
  return (
    <div className="create-mo__step">
      <p className="create-mo__step-label">{S.moStep2Label}</p>

      <Field label={S.moCurrency}>
        <div className="create-mo__currency-toggle">
          {['USD', 'SYP'].map((c) => (
            <button
              key={c}
              type="button"
              className={`create-mo__currency-btn${form.currency === c ? ' create-mo__currency-btn--active' : ''}`}
              onClick={() => set('currency')({ target: { value: c } })}
            >
              {c}
            </button>
          ))}
        </div>
      </Field>

      <Field label={`${S.moItemDescription} *`}>
        <input
          className="create-mo__input"
          type="text"
          value={form.item_description}
          onChange={set('item_description')}
          placeholder={S.moItemDescPlaceholder}
          dir="rtl"
        />
      </Field>

      <Field label={`${S.moItemPrice} *`}>
        <input
          className="create-mo__input create-mo__input--mono"
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
        <div className="create-mo__tag-input-row">
          <input
            className="create-mo__input"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder={S.moTagPlaceholder}
            dir="rtl"
          />
          <button
            type="button"
            className="create-mo__tag-add-btn"
            onClick={addTag}
          >
            {S.moAddTag}
          </button>
        </div>
        {form.tags.length > 0 && (
          <div className="create-mo__tags">
            {form.tags.map((tag) => (
              <span key={tag} className="create-mo__tag">
                {tag}
                <button
                  type="button"
                  className="create-mo__tag-remove"
                  onClick={() => removeTag(tag)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </Field>
    </div>
  );
}

// ─── Step 3: Attachments ──────────────────────────────────────────────────────

function Step3({ attachments, handleFileChange, removeAttachment }) {
  return (
    <div className="create-mo__step">
      <p className="create-mo__step-label">{S.moStep3Label}</p>

      <label className="create-mo__file-label">
        <span className="create-mo__file-icon">📎</span>
        <span>{S.moAddAttachment}</span>
        <input
          type="file"
          multiple
          accept="application/pdf,image/jpeg,image/png"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </label>

      {attachments.length > 0 && (
        <div className="create-mo__attachments">
          {attachments.map((f, i) => (
            <div key={i} className="create-mo__attachment">
              <span className="create-mo__attachment-name">{f.name}</span>
              <span className="create-mo__attachment-size">
                {(f.size / 1024).toFixed(0)} KB
              </span>
              <button
                type="button"
                className="create-mo__attachment-remove"
                onClick={() => removeAttachment(i)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {attachments.length === 0 && (
        <p className="create-mo__optional-note">{S.moAttachmentOptional}</p>
      )}
    </div>
  );
}

// ─── Step 4: Review ───────────────────────────────────────────────────────────

function Step4({ form, selectedAsset, attachments }) {
  return (
    <div className="create-mo__step">
      <p className="create-mo__step-label">{S.moStep4Label}</p>

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
          <div className="create-mo__review-row">
            <span className="create-mo__review-label">{S.moTags}</span>
            <div className="create-mo__review-tags">
              {form.tags.map((t) => (
                <span key={t} className="create-mo__review-tag">{t}</span>
              ))}
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
    <div className="create-mo__review-row">
      <span className="create-mo__review-label">{label}</span>
      <span className={`create-mo__review-value${mono ? ' create-mo__review-value--mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="create-mo__field">
      <label className="create-mo__field-label">{label}</label>
      {children}
    </div>
  );
}