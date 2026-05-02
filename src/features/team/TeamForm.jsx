import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { S } from '@/lib/strings';
import { DEPARTMENTS } from '@/lib/constants';
import './TeamForm.scss';

const EMPTY_FORM = {
  full_name: '',
  title: '',
  department: '',
  is_active: true,
};

export default function TeamForm() {
  const { id } = useParams(); // undefined on create
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load existing member on edit
  useEffect(() => {
    if (!isEdit) return;
    async function load() {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('id', id)
        .single();

      if (error) { setError(error.message); setLoading(false); return; }

      setForm({
        full_name: data.full_name ?? '',
        title: data.title ?? '',
        department: data.department ?? '',
        is_active: data.is_active ?? true,
      });
      setLoading(false);
    }
    load();
  }, [id, isEdit]);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.full_name.trim()) { setError(S.teamErrorName); return; }
    if (!form.title.trim())     { setError(S.teamErrorTitle); return; }
    if (!form.department)       { setError(S.teamErrorDept); return; }
    setError(null);
    setSaving(true);

    try {
      const payload = {
        full_name: form.full_name.trim(),
        title: form.title.trim(),
        department: form.department,
        is_active: form.is_active,
        updated_at: new Date().toISOString(),
      };

      if (isEdit) {
        const { error } = await supabase
          .from('team_members')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
        navigate(`/team/${id}`);
      } else {
        const { data, error } = await supabase
          .from('team_members')
          .insert({ ...payload, updated_at: undefined })
          .select('id')
          .single();
        if (error) throw error;
        navigate(`/team/${data.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="team-form team-form--loading">
        <div className="team-form__skeleton team-form__skeleton--tall" />
        <div className="team-form__skeleton" />
        <div className="team-form__skeleton" />
      </div>
    );
  }

  return (
    <div className="team-form">
      <div className="team-form__topbar">
        <button className="team-form__back" onClick={() => navigate(-1)}>
          {S.back}
        </button>
        <h1 className="team-form__title">
          {isEdit ? S.teamEditTitle : S.teamCreateTitle}
        </h1>
        <div style={{ width: 48 }} />
      </div>

      <div className="team-form__body">
        {/* Full name */}
        <div className="team-form__field">
          <label className="team-form__label">
            {S.teamMemberFullName} <span className="team-form__required">*</span>
          </label>
          <input
            className="team-form__input"
            type="text"
            value={form.full_name}
            onChange={set('full_name')}
            placeholder={S.teamNamePlaceholder}
            dir="rtl"
          />
        </div>

        {/* Title */}
        <div className="team-form__field">
          <label className="team-form__label">
            {S.teamMemberTitle} <span className="team-form__required">*</span>
          </label>
          <input
            className="team-form__input"
            type="text"
            value={form.title}
            onChange={set('title')}
            placeholder={S.teamTitlePlaceholder}
            dir="rtl"
          />
        </div>

        {/* Department */}
        <div className="team-form__field">
          <label className="team-form__label">
            {S.teamMemberDepartment} <span className="team-form__required">*</span>
          </label>
          <select
            className="team-form__select"
            value={form.department}
            onChange={set('department')}
            dir="rtl"
          >
            <option value="">{S.teamDeptPlaceholder}</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Active toggle (edit only) */}
        {isEdit && (
          <div className="team-form__field team-form__field--inline">
            <label className="team-form__label">{S.teamActiveLabel}</label>
            <button
              type="button"
              className={`team-form__toggle${form.is_active ? ' team-form__toggle--on' : ''}`}
              onClick={() => setForm((prev) => ({ ...prev, is_active: !prev.is_active }))}
            >
              <span className="team-form__toggle-knob" />
            </button>
          </div>
        )}

        {error && <p className="team-form__error">{error}</p>}
      </div>

      <div className="team-form__footer">
        <button
          className="team-form__submit"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? S.saving : isEdit ? S.teamSaveChanges : S.teamCreate}
        </button>
      </div>
    </div>
  );
}