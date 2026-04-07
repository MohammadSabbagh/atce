import { S } from '@/lib/strings'
import '@/styles/create-po.scss'

export default function SubmitSuccess({ onDone }) {
  return (
    <div className="submit-success">
      <div className="submit-success__icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h2 className="submit-success__title">{S.successTitle}</h2>
      <p className="submit-success__subtitle">{S.successSubtitle}</p>
      <button className="submit-success__btn" onClick={onDone}>
        {S.successBackBtn}
      </button>
    </div>
  )
}