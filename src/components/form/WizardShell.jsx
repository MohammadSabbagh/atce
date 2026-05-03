// ─────────────────────────────────────────────────────────────────────────────
//  WizardShell
//
//  Shared shell for multi-step wizards (Create PO, Create MO, future HR
//  wizards). Title appears at the top of the body (centered or right-aligned
//  by RTL), step indicator below, scrollable body, sticky footer.
//
//  Footer button shape:
//    primary    — required.  { label, onClick, disabled? }
//    secondary  — optional.  { label, onClick, disabled? }   (back button)
//
//  No top navbar. Cancellation happens via the secondary footer button only.
//  See PR 4 decision #2: footer-only-back is the canonical wizard pattern.
//
//  Loading and success states are NOT the shell's concern — the consumer
//  decides whether to render <WizardShell> or a different view.
// ─────────────────────────────────────────────────────────────────────────────

import StepIndicator from './StepIndicator'
import './WizardShell.scss'

export default function WizardShell({
  title,
  step,
  totalSteps,
  stepLabels,
  error,
  primary,
  secondary,
  children,
}) {
  return (
    <div className="wizard-shell">
      <div className="wizard-shell__header">
        <h1 className="wizard-shell__title">{title}</h1>
        <StepIndicator current={step} labels={stepLabels} />
      </div>

      <div className="wizard-shell__body">
        {children}
      </div>

      {error && (
        <div className="wizard-shell__error">{error}</div>
      )}

      <div className="wizard-shell__footer">
        {secondary && (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={secondary.onClick}
            disabled={secondary.disabled}
          >
            {secondary.label}
          </button>
        )}
        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={primary.onClick}
          disabled={primary.disabled}
        >
          {primary.label}
        </button>
      </div>
    </div>
  )
}