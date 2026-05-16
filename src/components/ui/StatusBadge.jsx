import './StatusBadge.scss'
import { S } from '@/lib/strings'

const STATUS_LABELS = {
  draft:       S.statusDraft,
  pending_ceo: S.statusPendingCeo,
  approved:    S.statusApproved,
  released:    S.statusReleased,
  rejected:    S.statusRejected,
  cancelled:   S.statusCancelled,
}

export default function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}