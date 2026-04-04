// features/dashboard/components/LiveIndicator.jsx
import './LiveIndicator.scss'
import { S } from '../../../lib/strings'

export function LiveIndicator({ lastUpdated }) {
  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('ar-SA', {
        hour:   '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '—'

  return (
    <div className="live-indicator">
      <span className="live-indicator__dot" aria-hidden="true" />
      <span className="live-indicator__label">{S.live}</span>
      {/* <span className="live-indicator__time">
        {S.lastUpdated}: {timeStr}
      </span> */}
    </div>
  )
}