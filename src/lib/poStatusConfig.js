// src/lib/poStatusConfig.js
// Single source of truth for PO status labels, action labels, badge colors, and flow logic.
// To rename any button or badge — change it here only.

// ─── Status Labels ───────────────────────────────────
export const PO_STATUS_LABELS = {
  pending:  'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  released: 'Released',
}

// ─── Action Labels ───────────────────────────────────
export const PO_ACTION_LABELS = {
  approve:         'Approve',
  reject:          'Reject',
  release:         'Release',
  approve_release: 'Approve & Release',  // Finance action on non-CEO POs
}

// ─── Badge color map (maps to SCSS $color-* tokens) ──
// Use these keys to drive className logic in components.
export const PO_STATUS_COLOR = {
  pending:  'pending',   // $color-pending  — amber
  approved: 'approved',  // $color-approved — green
  rejected: 'rejected',  // $color-rejected — red
  released: 'fulfilled', // $color-fulfilled — purple (reusing fulfilled token)
}

// ─── Flow helpers ────────────────────────────────────

/**
 * What action(s) can the CEO take on this PO?
 * Returns null if no action is available.
 */
export function getCEOActions(po) {
  if (!po.requires_ceo) return null
  if (po.status !== 'pending') return null
  return { canApprove: true, canReject: true }
}

/**
 * What action can Finance take on this PO?
 * Returns null if no action is available.
 */
export function getFinanceAction(po) {
  if (po.status === 'rejected' || po.status === 'released') return null

  // Non-CEO PO: Finance does Approve & Release in one action
  if (!po.requires_ceo && po.status === 'pending') {
    return { label: PO_ACTION_LABELS.approve_release, action: 'approve_release' }
  }

  // CEO PO: Finance releases after CEO approval
  if (po.requires_ceo && po.status === 'approved') {
    return { label: PO_ACTION_LABELS.release, action: 'release' }
  }

  return null
}

/**
 * Human-readable label for a given status value.
 */
export function getStatusLabel(status) {
  return PO_STATUS_LABELS[status] ?? status
}

/**
 * CSS modifier key for badge styling.
 * Usage: className={`badge badge--${getStatusColor(po.status)}`}
 */
export function getStatusColor(status) {
  return PO_STATUS_COLOR[status] ?? 'pending'
}