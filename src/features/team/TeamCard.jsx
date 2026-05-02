import { S } from '@/lib/strings';
import './TeamCard.scss';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0);
  return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
}

export default function TeamCard({ member, onClick }) {
  return (
    <div className="team-card" onClick={onClick}>
      <div className="team-card__avatar-col">
        <div className="team-card__avatar">
          {getInitials(member.full_name)}
        </div>
      </div>

      <div className="team-card__body">
        <div className="team-card__top">
          <span className="team-card__name">{member.full_name}</span>
          <span
            className={`team-card__status${
              member.is_active ? '' : ' team-card__status--inactive'
            }`}
          >
            {member.is_active ? S.teamMemberActive : S.teamMemberInactive}
          </span>
        </div>

        {member.title && (
          <div className="team-card__title">{member.title}</div>
        )}

        <div className="team-card__bottom">
          <span className="team-card__dept">{member.department}</span>
        </div>
      </div>
    </div>
  );
}