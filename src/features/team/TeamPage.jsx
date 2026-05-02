import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeam } from './useTeam';
import TeamCard from './TeamCard';
import FilterChips from '@/components/ui/FilterChips';
import { S } from '@/lib/strings';
import { DEPARTMENTS } from '@/lib/constants';
import './TeamPage.scss';

const DEPT_FILTERS = [
  { value: 'all', label: S.filterAll },
  ...DEPARTMENTS.map((d) => ({ value: d, label: d })),
];

export default function TeamPage() {
  const navigate = useNavigate();
  const [deptFilter, setDeptFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { members, loading } = useTeam();

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (deptFilter !== 'all' && m.department !== deptFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          m.full_name?.toLowerCase().includes(q) ||
          m.title?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [members, deptFilter, search]);

  return (
    <div className="team-page">
      <div className="team-page__header">
        <h1 className="team-page__title">{S.teamTitle}</h1>
        <button
          className="team-page__add-btn"
          onClick={() => navigate('/team/new')}
        >
          {S.teamAddNew}
        </button>
      </div>

      <div className="team-page__search-wrap">
        <input
          className="team-page__search"
          type="text"
          placeholder={S.teamSearchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="team-page__filters">
        <FilterChips
          options={DEPT_FILTERS}
          value={deptFilter}
          onChange={setDeptFilter}
        />
      </div>

      <div className="team-page__list">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="team-page__skeleton" />
          ))
        ) : filtered.length === 0 ? (
          <div className="team-page__empty">{S.teamEmpty}</div>
        ) : (
          filtered.map((member) => (
            <TeamCard
              key={member.id}
              member={member}
              onClick={() => navigate(`/team/${member.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}