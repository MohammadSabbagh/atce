// src/features/mo/useMOList.js
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import db from '@/lib/db';

export function useMOList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const statusFilter = searchParams.get('status') ?? 'all';
  const typeFilter   = searchParams.get('type')   ?? 'all';

  const mos = useLiveQuery(
    () => db.maintenance_orders
      .orderBy('created_at')
      .reverse()
      .toArray(),
    []
  );

  // Determine loading state: undefined = Dexie query not yet resolved
  const loading = mos === undefined;

  const filtered = useMemo(() => {
    if (!mos) return [];
    return mos.filter((mo) => {
      if (statusFilter !== 'all' && mo.status !== statusFilter) return false;
      if (typeFilter !== 'all' && mo.type !== typeFilter) return false;
      return true;
    });
  }, [mos, statusFilter, typeFilter]);

  const setStatusFilter = (status) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (status === 'all') next.delete('status');
      else next.set('status', status);
      return next;
    });
  };

  const setTypeFilter = (type) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (type === 'all') next.delete('type');
      else next.set('type', type);
      return next;
    });
  };

  return {
    mos: filtered,
    loading,
    statusFilter,
    typeFilter,
    setStatusFilter,
    setTypeFilter,
  };
}