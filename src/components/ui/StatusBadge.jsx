import '@/styles/status-badge.scss'

const STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  fulfilled: 'Fulfilled',
  open: 'Open',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}