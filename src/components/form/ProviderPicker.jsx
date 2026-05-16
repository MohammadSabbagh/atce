// src/components/form/ProviderPicker.jsx
// Reusable provider selector with typeahead + inline "add new".
//
// Usage:
//   <ProviderPicker
//     value={form.provider_id}
//     onChange={(id) => setField('provider_id', id)}
//   />
//
// Stores the provider_id. Displays the selected provider's name.
// Reads provider list from Dexie cache; inline create writes to Supabase
// and the new row appears via providersSync (or directly if Realtime is on).

import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { S } from '@/lib/strings';
import './ProviderPicker.scss';

export default function ProviderPicker({ value, onChange, placeholder }) {
  const [open, setOpen]       = useState(false);
  const [search, setSearch]   = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // All active providers, sorted by name
  const providers = useLiveQuery(
    () =>
      db.providers
        .filter((p) => p.is_active !== false)
        .toArray()
        .then((rows) =>
          rows.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'ar'))
        ),
    []
  ) ?? [];

  // Resolve the currently selected provider — read from cache reactively
  const selected = useLiveQuery(
    () => (value ? db.providers.get(value) : null),
    [value]
  );

  const filtered = search
    ? providers.filter((p) =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.phone?.toLowerCase().includes(search.toLowerCase())
      )
    : providers;

  // Exact-name match for "add new" affordance
  const trimmed = search.trim();
  const hasExactMatch = trimmed
    ? providers.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())
    : false;
  const showCreateBtn = trimmed.length > 0 && !hasExactMatch && !creating;

  // Close picker on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const select = (provider) => {
    onChange(provider.id);
    setOpen(false);
    setSearch('');
    setCreateError(null);
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange(null);
  };

  const handleCreate = async () => {
    if (!trimmed || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const { data, error } = await supabase
        .from('providers')
        .insert({ name: trimmed, is_active: true })
        .select('*')
        .single();
      if (error) throw error;

      // Optimistically write to Dexie so the picker shows it immediately,
      // even before providersSync's Realtime/delta picks it up.
      await db.providers.put(data);

      onChange(data.id);
      setOpen(false);
      setSearch('');
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="provider-picker">
      {selected ? (
        <div
          className="provider-picker__selected"
          onClick={() => setOpen(true)}
        >
          <span className="provider-picker__name">{selected.name}</span>
          {selected.phone && (
            <span className="provider-picker__phone mono">{selected.phone}</span>
          )}
          <button
            type="button"
            className="provider-picker__clear"
            onClick={clear}
            aria-label="مسح"
          >
            ×
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="provider-picker__btn"
          onClick={() => setOpen(true)}
        >
          {placeholder ?? S.providerSelectPlaceholder}
        </button>
      )}

      {open && (
        <div className="provider-picker__dropdown">
          <input
            className="provider-picker__search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={S.providersSearchPlaceholder}
            dir="rtl"
            autoFocus
          />

          {createError && (
            <p className="provider-picker__error">{createError}</p>
          )}

          {showCreateBtn && (
            <button
              type="button"
              className="provider-picker__create"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating
                ? S.saving
                : `${S.providerAddInline} "${trimmed}"`}
            </button>
          )}

          <div className="provider-picker__list">
            {filtered.length === 0 ? (
              <p className="provider-picker__empty">
                {trimmed ? S.providersNoMatch : S.providersEmpty}
              </p>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="provider-picker__option"
                  onClick={() => select(p)}
                >
                  <span className="provider-picker__option-name">{p.name}</span>
                  <div className="provider-picker__option-meta">
                    {p.contact_name && (
                      <span className="provider-picker__option-contact">{p.contact_name}</span>
                    )}
                    {p.phone && (
                      <span className="provider-picker__option-phone mono">{p.phone}</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}