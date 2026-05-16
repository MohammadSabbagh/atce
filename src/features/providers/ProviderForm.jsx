import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { S } from '@/lib/strings';
import './ProviderForm.scss';

const EMPTY_FORM = {
  name: '',
  contact_name: '',
  phone: '',
  email: '',
  notes: '',
  is_active: true,
};

export default function ProviderForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    async function load() {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) { setError(error.message); setLoading(false); return; }

      setForm({
        name:         data.name ?? '',
        contact_name: data.contact_name ?? '',
        phone:        data.phone ?? '',
        email:        data.email ?? '',
        notes:        data.notes ?? '',
        is_active:    data.is_active ?? true,
      });
      setLoading(false);
    }
    load();
  }, [id, isEdit]);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError(S.providerErrorName); return; }
    setError(null);
    setSaving(true);

    try {
      const payload = {
        name:         form.name.trim(),
        contact_name: form.contact_name.trim() || null,
        phone:        form.phone.trim() || null,
        email:        form.email.trim() || null,
        notes:        form.notes.trim() || null,
        is_active:    form.is_active,
        updated_at:   new Date().toISOString(),
      };

      if (isEdit) {
        const { error } = await supabase
          .from('providers')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
        navigate(`/providers/${id}`);
      } else {
        const { data, error } = await supabase
          .from('providers')
          .insert({ ...payload, updated_at: undefined })
          .select('id')
          .single();
        if (error) throw error;
        navigate(`/providers/${data.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="provider-form provider-form--loading">
        <div className="provider-form__skeleton provider-form__skeleton--tall" />
        <div className="provider-form__skeleton" />
        <div className="provider-form__skeleton" />
      </div>
    );
  }

  return (
    <div className="provider-form">
      <div className="provider-form__topbar">
        <button className="provider-form__back" onClick={() => navigate(-1)}>
          {S.back}
        </button>
        <h1 className="provider-form__title">
          {isEdit ? S.providerEditTitle : S.providerCreateTitle}
        </h1>
        <div style={{ width: 48 }} />
      </div>

      <div className="provider-form__body">
        {/* Name */}
        <div className="provider-form__field">
          <label className="provider-form__label">
            {S.providerName} <span className="provider-form__required">*</span>
          </label>
          <input
            className="provider-form__input"
            type="text"
            value={form.name}
            onChange={set('name')}
            placeholder={S.providerNamePlaceholder}
            dir="rtl"
          />
        </div>

        {/* Contact name */}
        <div className="provider-form__field">
          <label className="provider-form__label">{S.providerContactName}</label>
          <input
            className="provider-form__input"
            type="text"
            value={form.contact_name}
            onChange={set('contact_name')}
            placeholder={S.providerContactPlaceholder}
            dir="rtl"
          />
        </div>

        {/* Phone */}
        <div className="provider-form__field">
          <label className="provider-form__label">{S.providerPhone}</label>
          <input
            className="provider-form__input mono"
            type="tel"
            value={form.phone}
            onChange={set('phone')}
            placeholder={S.providerPhonePlaceholder}
            dir="ltr"
          />
        </div>

        {/* Email */}
        <div className="provider-form__field">
          <label className="provider-form__label">{S.providerEmail}</label>
          <input
            className="provider-form__input"
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder={S.providerEmailPlaceholder}
            dir="ltr"
          />
        </div>

        {/* Notes */}
        <div className="provider-form__field">
          <label className="provider-form__label">{S.providerNotes}</label>
          <textarea
            className="provider-form__textarea"
            value={form.notes}
            onChange={set('notes')}
            placeholder={S.providerNotesPlaceholder}
            dir="rtl"
            rows={3}
          />
        </div>

        {/* Active toggle (edit only) */}
        {isEdit && (
          <div className="provider-form__field provider-form__field--inline">
            <label className="provider-form__label">{S.providerActiveLabel}</label>
            <button
              type="button"
              className={`provider-form__toggle${form.is_active ? ' provider-form__toggle--on' : ''}`}
              onClick={() => setForm((prev) => ({ ...prev, is_active: !prev.is_active }))}
            >
              <span className="provider-form__toggle-knob" />
            </button>
          </div>
        )}

        {error && <p className="provider-form__error">{error}</p>}
      </div>

      <div className="provider-form__footer">
        <button
          className="provider-form__submit"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? S.saving : isEdit ? S.providerSaveChanges : S.providerCreate}
        </button>
      </div>
    </div>
  );
}