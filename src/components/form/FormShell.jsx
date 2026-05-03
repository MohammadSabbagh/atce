// ─────────────────────────────────────────────────────────────────────────────
//  FormShell
//
//  Shared shell for single-page forms (AssetForm, future HR detail forms).
//  Different pattern from <WizardShell>:
//
//    • Sticky topbar with back button + centered title (navbar-style)
//    • Scrollable body
//    • Footer with a single primary button
//
//  This is intentionally distinct from <WizardShell> — single-page forms
//  benefit from a persistent "back out of here" affordance. See PR 4
//  decision #3.
//
//  primary  — required. { label, onClick, disabled? }
//  onBack   — required. Called when topbar back button is tapped.
// ─────────────────────────────────────────────────────────────────────────────

import { S } from '@/lib/strings'
import './FormShell.scss'

export default function FormShell({
  title,
  onBack,
  primary,
  children,
}) {
  return (
    <div className="form-shell">
      <div className="form-shell__topbar">
        <button
          type="button"
          className="form-shell__back"
          onClick={onBack}
        >
          {S.back}
        </button>
        <h1 className="form-shell__title">{title}</h1>
        {/* Spacer keeps the title visually centered against the back button */}
        <div className="form-shell__spacer" aria-hidden="true" />
      </div>

      <div className="form-shell__body">
        {children}
      </div>

      <div className="form-shell__footer">
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