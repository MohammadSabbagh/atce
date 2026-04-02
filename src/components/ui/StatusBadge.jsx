import '@/styles/status-badge.scss'
import { S } from '@/lib/strings'

export default function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      {S.status[status] ?? status}
    </span>
  )
}