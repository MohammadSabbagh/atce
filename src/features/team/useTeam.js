// useTeam.js
import { useLiveQuery } from 'dexie-react-hooks';
import db from '@/lib/db';

export function useTeam() {
  const members = useLiveQuery(
    () =>
      db.team_members
        .toArray()
        .then((rows) =>
          rows.sort((a, b) => (a.full_name ?? '').localeCompare(b.full_name ?? '', 'ar'))
        ),
    []
  );

  return { members: members ?? [], loading: members === undefined };
}