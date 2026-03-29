import '@/styles/step-indicator.scss'

export default function StepIndicator({ current, labels }) {
  return (
    <div className="step-indicator">
      {labels.map((label, i) => {
        const num = i + 1
        const state =
          num < current ? 'done' : num === current ? 'active' : 'idle'
        return (
          <div key={label} className={`step-indicator__step step-indicator__step--${state}`}>
            <div className="step-indicator__dot">
              {state === 'done' ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span>{num}</span>
              )}
            </div>
            {i < labels.length - 1 && <div className="step-indicator__line" />}
          </div>
        )
      })}
    </div>
  )
}