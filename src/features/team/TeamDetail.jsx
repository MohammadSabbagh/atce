import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { S } from '@/lib/strings';
import './TeamDetail.scss';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0);
  return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
}

export default function TeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMember() {
      setLoading(true);
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('id', id)
        .single();

      if (error) setError(error.message);
      else setMember(data);
      setLoading(false);
    }
    fetchMember();
  }, [id]);

  if (loading) {
    return (
      <div className="team-detail team-detail--loading">
        <div className="team-detail__skeleton team-detail__skeleton--avatar" />
        <div className="team-detail__skeleton team-detail__skeleton--title" />
        <div className="team-detail__skeleton team-detail__skeleton--row" />
        <div className="team-detail__skeleton team-detail__skeleton--row" />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="team-detail team-detail--error">
        <p className="team-detail__error-msg">{S.errorGeneric}</p>
      </div>
    );
  }

  return (
    <div className="team-detail">
      <div className="team-detail__topbar">
        <button className="team-detail__back" onClick={() => navigate(-1)}>
          {S.back}
        </button>
        <button
          className="team-detail__edit-btn"
          onClick={() => navigate(`/team/${id}/edit`)}
        >
          {S.edit}
        </button>
      </div>

      <div className="team-detail__avatar-wrap">
        <div className="team-detail__avatar">{getInitials(member.full_name)}</div>
      </div>

      <div className="team-detail__content">
        <div className="team-detail__name-row">
          <h1 className="team-detail__name">{member.full_name}</h1>
          <span
            className={`team-detail__status${
              member.is_active ? '' : ' team-detail__status--inactive'
            }`}
          >
            {member.is_active ? S.teamMemberActive : S.teamMemberInactive}
          </span>
        </div>

        {member.title && (
          <div className="team-detail__title-text">{member.title}</div>
        )}

        <div className="team-detail__badges">
          <span className="team-detail__dept">{member.department}</span>
        </div>
      </div>
    </div>
  );
}