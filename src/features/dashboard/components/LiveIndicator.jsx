// features/dashboard/components/LiveIndicator.jsx
import { useSyncState } from '@/lib/useSyncState'
import './LiveIndicator.scss'

const STATE_CONFIG = {
  offline:  { label: 'غير متصل',  modifier: 'offline'  },
  syncing:  { label: 'مزامنة…',   modifier: 'syncing'  },
  updated:  { label: 'مُحدّث',    modifier: 'updated'  },
  live:     { label: 'مباشر',     modifier: 'live'     },
  idle:     { label: '—',         modifier: 'idle'     },
}

export function LiveIndicator() {
  const syncState = useSyncState()
  const { label, modifier } = STATE_CONFIG[syncState] ?? STATE_CONFIG.idle

  return (
    <div className={`live-indicator live-indicator--${modifier}`}>
      <span className="live-indicator__dot" aria-hidden="true" />
      <span className="live-indicator__label">{label}</span>
    </div>
  )
}