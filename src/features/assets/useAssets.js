// useAssets.js
import { useLiveQuery } from 'dexie-react-hooks';
import db from '@/lib/db';

export function useAssets() {
  const assets = useLiveQuery(
    () => db.assets.toArray().then((rows) => rows.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'ar'))),
    []
  );

  return { assets: assets ?? [], loading: assets === undefined };
}