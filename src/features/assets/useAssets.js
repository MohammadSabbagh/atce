// useAssets.js
import { useLiveQuery } from 'dexie-react-hooks';
import db from '@/lib/db';

export function useAssets() {
  const assets = useLiveQuery(async () => {
    const [rows, members] = await Promise.all([
      db.assets.toArray(),
      db.team_members.toArray(),
    ]);

    const memberMap = new Map(members.map((m) => [m.id, m.full_name]));

    return rows
      .map((a) => ({
        ...a,
        assignee_name: a.assigned_to ? memberMap.get(a.assigned_to) ?? null : null,
      }))
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'ar'));
  }, []);

  return { assets: assets ?? [], loading: assets === undefined };
}