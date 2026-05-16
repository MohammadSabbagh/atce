// src/features/providers/useProviderDetail.js
//
// Provider detail data hook.
// Reads provider from Dexie (instant) and reverse-FK lists from Supabase.
// POs/MOs/Assets lists are full (option b — no pagination for now).

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { supabase } from '@/lib/supabase';
import db from '@/lib/db';

export function useProviderDetail() {
  const { id } = useParams();

  // Read provider row from Dexie (kept fresh by providersSync)
  const provider = useLiveQuery(
    () => (id ? db.providers.get(id) : null),
    [id]
  );

  const [linkedPOs,    setLinkedPOs]    = useState([]);
  const [linkedMOs,    setLinkedMOs]    = useState([]);
  const [linkedAssets, setLinkedAssets] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function fetchLinked() {
      setLoading(true);
      setError(null);

      const [poRes, moRes, assetsRes] = await Promise.all([
        supabase
          .from('purchase_orders')
          .select('id, po_number, title, status, total, currency, created_at')
          .eq('provider_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('maintenance_orders')
          .select('id, mo_number, title, status, item_price, currency, type, created_at')
          .eq('provider_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('assets')
          .select('id, name, type, department, is_active')
          .eq('provider_id', id)
          .order('name', { ascending: true }),
      ]);

      if (cancelled) return;

      if (poRes.error || moRes.error || assetsRes.error) {
        setError((poRes.error || moRes.error || assetsRes.error).message);
      } else {
        setLinkedPOs(poRes.data ?? []);
        setLinkedMOs(moRes.data ?? []);
        setLinkedAssets(assetsRes.data ?? []);
      }
      setLoading(false);
    }

    fetchLinked();
    return () => { cancelled = true; };
  }, [id]);

  return {
    provider,
    linkedPOs,
    linkedMOs,
    linkedAssets,
    loading: provider === undefined || loading,
    error,
  };
}