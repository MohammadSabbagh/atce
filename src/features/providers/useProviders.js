// src/features/providers/useProviders.js
import { useLiveQuery } from 'dexie-react-hooks';
import db from '@/lib/db';

export function useProviders() {
  const providers = useLiveQuery(
    () =>
      db.providers
        .toArray()
        .then((rows) =>
          rows.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'ar'))
        ),
    []
  );

  return { providers: providers ?? [], loading: providers === undefined };
}