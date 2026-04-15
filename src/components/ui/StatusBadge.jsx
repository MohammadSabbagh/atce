import '@/styles/status-badge.scss'
import { S } from '@/lib/strings'

const STATUS_LABELS = {
  draft:     S.statusDraft,
  pending:   S.statusPending,
  approved:  S.statusApproved,
  released:  S.statusReleased,
  rejected:  S.statusRejected,
  cancelled: S.statusCancelled,
}

export default function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}