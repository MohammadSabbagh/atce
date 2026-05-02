import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { supabase } from '../../lib/supabase';
import db from '@/lib/db';
import { useAuth } from '../auth/AuthContext';
import { S } from '../../lib/strings';
import { DEPARTMENTS, ASSET_TYPES } from '@/lib/constants';
import './AssetForm.scss';

const EMPTY_FORM = {
  name: '',
  type: 'other',
  department: '',
  serial_number: '',
  plate_number: '',
  model: '',
  assigned_to: '',
  source_po_number: '',
  notes: '',
  is_active: true,
};

export default function AssetForm() {
  const { id } = useParams(); // undefined on create
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // ── Team member picker state ─────────────────────────────────
  // Mirrors MoCreate's asset picker pattern: form holds the FK
  // (assigned_to UUID) for persistence; selectedMember holds the
  // hydrated row for display in the trigger.
  const [memberSearch, setMemberSearch]         = useState('');
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const [selectedMember, setSelectedMember]     = useState(null);

  const members = useLiveQuery(
    () =>
      db.team_members
        .filter((m) => m.is_active !== false)
        .toArray()
        .then((rows) =>
          rows.sort((a, b) => (a.full_name ?? '').localeCompare(b.full_name ?? '', 'ar'))
        ),
    []
  ) ?? [];

  const filteredMembers = memberSearch
    ? members.filter((m) =>
        m.full_name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.title?.toLowerCase().includes(memberSearch.toLowerCase())
      )
    : members;

  const selectMember = (member) => {
    setSelectedMember(member);
    setForm((prev) => ({ ...prev, assigned_to: member.id }));
    setMemberPickerOpen(false);
    setMemberSearch('');
  };

  const clearMember = () => {
    setSelectedMember(null);
    setForm((prev) => ({ ...prev, assigned_to: '' }));
  };

  // Load existing asset on edit
  useEffect(() => {
    if (!isEdit) return;
    async function load() {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) { setError(error.message); setLoading(false); return; }

      setForm({
        name: data.name ?? '',
        type: data.type ?? 'other',
        department: data.department ?? '',
        serial_number: data.serial_number ?? '',
        plate_number: data.plate_number ?? '',
        model: data.model ?? '',
        assigned_to: data.assigned_to ?? '',
        source_po_number: data.source_po_number ?? '',
        notes: data.notes ?? '',
        is_active: data.is_active ?? true,
      });

      if (data.image_url) {
        setExistingImageUrl(data.image_url);
        setImagePreview(
          `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/attachments/${data.image_url}`
        );
      }

      // Hydrate selected member from Dexie cache (already synced)
      if (data.assigned_to) {
        const member = await db.team_members.get(data.assigned_to);
        if (member) setSelectedMember(member);
      }

      setLoading(false);
    }
    load();
  }, [id, isEdit]);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError(S.assetErrorName); return; }
    if (!form.department) { setError(S.assetErrorDept); return; }
    setError(null);
    setSaving(true);

    try {
      let image_url = existingImageUrl ?? null;

      // Upload image if new file selected
      if (imageFile) {
        const assetId = id ?? 'temp-' + Date.now();
        const path = `assets/${assetId}/${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(path, imageFile, { upsert: true });
        if (uploadError) throw uploadError;
        image_url = path;
      }

      const payload = {
        name: form.name.trim(),
        type: form.type,
        department: form.department,
        serial_number: form.serial_number.trim() || null,
        plate_number: form.type === 'car' ? (form.plate_number.trim() || null) : null,
        model: form.type === 'car' ? (form.model.trim() || null) : null,
        assigned_to: form.assigned_to || null,
        source_po_number: form.source_po_number.trim() || null,
        notes: form.notes.trim() || null,
        is_active: form.is_active,
        image_url,
        updated_at: new Date().toISOString(),
      };

      if (isEdit) {
        const { error } = await supabase
          .from('assets')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
        navigate(`/assets/${id}`);
      } else {
        const { data, error } = await supabase
          .from('assets')
          .insert({ ...payload, updated_at: undefined })
          .select('id')
          .single();
        if (error) throw error;

        // If we uploaded with temp id, rename the path
        if (imageFile && image_url?.startsWith('assets/temp-')) {
          const newPath = `assets/${data.id}/${imageFile.name}`;
          await supabase.storage.from('attachments').move(image_url, newPath);
          await supabase.from('assets').update({ image_url: newPath }).eq('id', data.id);
        }

        navigate(`/assets/${data.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="asset-form asset-form--loading">
        <div className="asset-form__skeleton asset-form__skeleton--tall" />
        <div className="asset-form__skeleton" />
        <div className="asset-form__skeleton" />
      </div>
    );
  }

  return (
    <div className="asset-form">
      <div className="asset-form__topbar">
        <button className="asset-form__back" onClick={() => navigate(-1)}>
          {S.back}
        </button>
        <h1 className="asset-form__title">
          {isEdit ? S.assetEditTitle : S.assetCreateTitle}
        </h1>
        <div style={{ width: 48 }} />
      </div>

      <div className="asset-form__body">

        {/* Image upload */}
        <div className="asset-form__image-section" onClick={() => fileInputRef.current?.click()}>
          {imagePreview ? (
            <img className="asset-form__image-preview" src={imagePreview} alt="" />
          ) : (
            <div className="asset-form__image-empty">
              <span className="asset-form__image-icon">📷</span>
              <span className="asset-form__image-label">{S.assetAddImage}</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
          {imagePreview && (
            <div className="asset-form__image-overlay">{S.assetChangeImage}</div>
          )}
        </div>

        {/* Type toggle */}
        <div className="asset-form__type-picker">
          {ASSET_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              className={`asset-form__type-option ${form.type === t.value ? 'asset-form__type-option--active' : ''}`}
              onClick={() => setForm((prev) => ({ ...prev, type: t.value }))}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Name */}
        <div className="asset-form__field">
          <label className="asset-form__label">{S.assetName} <span className="asset-form__required">*</span></label>
          <input
            className="asset-form__input"
            type="text"
            value={form.name}
            onChange={set('name')}
            placeholder={S.assetNamePlaceholder}
            dir="rtl"
          />
        </div>

        {/* Department */}
        <div className="asset-form__field">
          <label className="asset-form__label">{S.assetDepartment} <span className="asset-form__required">*</span></label>
          <select
            className="asset-form__select"
            value={form.department}
            onChange={set('department')}
            dir="rtl"
          >
            <option value="">{S.assetDeptPlaceholder}</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Car-specific */}
        {form.type === 'car' && (
          <>
            <div className="asset-form__field">
              <label className="asset-form__label">{S.assetPlateNumber}</label>
              <input
                className="asset-form__input asset-form__input--mono"
                type="text"
                value={form.plate_number}
                onChange={set('plate_number')}
                placeholder={S.assetPlatePlaceholder}
                dir="ltr"
              />
            </div>
            <div className="asset-form__field">
              <label className="asset-form__label">{S.assetModel}</label>
              <input
                className="asset-form__input"
                type="text"
                value={form.model}
                onChange={set('model')}
                placeholder={S.assetModelPlaceholder}
                dir="rtl"
              />
            </div>
          </>
        )}

        {/* Serial number */}
        <div className="asset-form__field">
          <label className="asset-form__label">{S.assetSerialNumber}</label>
          <input
            className="asset-form__input asset-form__input--mono"
            type="text"
            value={form.serial_number}
            onChange={set('serial_number')}
            placeholder={S.assetSerialPlaceholder}
            dir="ltr"
          />
        </div>

        {/* Assigned to — team member picker */}
        {/* Candidate for extraction into <EntityPicker /> primitive
            once a 3rd caller arrives (HR module's employment_requests
            employee picker is the likely third). */}
        <div className="asset-form__field">
          <label className="asset-form__label">{S.assetAssignedTo}</label>

          <div className="asset-form__member-picker">
            {selectedMember ? (
              <div
                className="asset-form__member-selected"
                onClick={() => setMemberPickerOpen(true)}
              >
                <span className="asset-form__member-name">{selectedMember.full_name}</span>
                {selectedMember.title && (
                  <span className="asset-form__member-title">{selectedMember.title}</span>
                )}
                <button
                  type="button"
                  className="asset-form__member-clear"
                  onClick={(e) => { e.stopPropagation(); clearMember(); }}
                  aria-label="مسح"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="asset-form__member-btn"
                onClick={() => setMemberPickerOpen(true)}
              >
                {S.assetSelectAssignee}
              </button>
            )}
          </div>

          {memberPickerOpen && (
            <div className="asset-form__member-dropdown">
              <input
                className="asset-form__member-search"
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder={S.teamSearchPlaceholder}
                dir="rtl"
                autoFocus
              />
              <div className="asset-form__member-list">
                {filteredMembers.length === 0 ? (
                  <p className="asset-form__member-empty">{S.teamEmpty}</p>
                ) : (
                  filteredMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className="asset-form__member-option"
                      onClick={() => selectMember(m)}
                    >
                      <span className="asset-form__member-option-name">{m.full_name}</span>
                      <div className="asset-form__member-option-meta">
                        {m.title && (
                          <span className="asset-form__member-option-title">{m.title}</span>
                        )}
                        {m.department && (
                          <span className="asset-form__member-option-dept">{m.department}</span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Source PO */}
        <div className="asset-form__field">
          <label className="asset-form__label">{S.assetSourcePO}</label>
          <input
            className="asset-form__input asset-form__input--mono"
            type="text"
            value={form.source_po_number}
            onChange={set('source_po_number')}
            placeholder="PO-001"
            dir="ltr"
          />
        </div>

        {/* Notes */}
        <div className="asset-form__field">
          <label className="asset-form__label">{S.assetNotes}</label>
          <textarea
            className="asset-form__textarea"
            value={form.notes}
            onChange={set('notes')}
            placeholder={S.assetNotesPlaceholder}
            rows={3}
            dir="rtl"
          />
        </div>

        {/* Active toggle (edit only) */}
        {isEdit && (
          <div className="asset-form__field asset-form__field--inline">
            <label className="asset-form__label">{S.assetActiveLabel}</label>
            <button
              type="button"
              className={`asset-form__toggle${form.is_active ? ' asset-form__toggle--on' : ''}`}
              onClick={() => setForm((prev) => ({ ...prev, is_active: !prev.is_active }))}
            >
              <span className="asset-form__toggle-knob" />
            </button>
          </div>
        )}

        {error && <p className="asset-form__error">{error}</p>}
      </div>

      <div className="asset-form__footer">
        <button
          className="asset-form__submit"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? S.saving : isEdit ? S.assetSaveChanges : S.assetCreate}
        </button>
      </div>
    </div>
  );
}