// moStatusConfig.js
// Single source of truth for MO status flow and transition rules.
// Mirrors poStatusConfig.js exactly — same lifecycle, same roles, same shape.
//
// Status labels live in src/lib/strings.js (S.statusXxx) — render via <StatusBadge />.
// Action button labels also live in strings.js (S.pmConfirm, S.approve, S.reject, S.release, S.cancel).
//
// Lifecycle (new model, post 2026-05-15 migration):
//
//   requires_ceo = false:
//     draft → approved → released
//
//   requires_ceo = true:
//     draft → pending_ceo → approved → released
//
//   Either path, before released:
//     → rejected  (terminal)
//     → cancelled (terminal)
//
//   Drafts are deleted, not cancelled.

import { S } from './strings'

// ─────────────────────────────────────────
// Status constants
// ─────────────────────────────────────────
export const MO_STATUS = {
  DRAFT:       'draft',
  PENDING_CEO: 'pending_ceo',
  APPROVED:    'approved',
  RELEASED:    'released',
  REJECTED:    'rejected',
  CANCELLED:   'cancelled',
}

// ─────────────────────────────────────────
// Flow rules — keyed by action id.
// See poStatusConfig.js for full documentation of the shape.
// ─────────────────────────────────────────
export const STATUS_TRANSITIONS = {
  // PM confirms draft. System picks the next status based on requires_ceo.
  pm_confirm: {
    from:         [MO_STATUS.DRAFT],
    to:           (mo) => (mo.requires_ceo ? MO_STATUS.PENDING_CEO : MO_STATUS.APPROVED),
    allowedRoles: ['purchase_manager'],
    requiresNote: false,
    actionLabel:  S.pmConfirm,
    condition:    () => true,
  },

  // CEO approves a pending_ceo MO.
  ceo_approve: {
    from:         [MO_STATUS.PENDING_CEO],
    to:           MO_STATUS.APPROVED,
    allowedRoles: ['ceo'],
    requiresNote: false,
    actionLabel:  S.approve,
    condition:    () => true,
  },

  // CEO rejects a pending_ceo MO.
  ceo_reject: {
    from:         [MO_STATUS.PENDING_CEO],
    to:           MO_STATUS.REJECTED,
    allowedRoles: ['ceo'],
    requiresNote: true,
    actionLabel:  S.reject,
    condition:    () => true,
  },

  // Finance releases an approved MO.
  finance_release: {
    from:         [MO_STATUS.APPROVED],
    to:           MO_STATUS.RELEASED,
    allowedRoles: ['finance'],
    requiresNote: false,
    actionLabel:  S.release,
    condition:    () => true,
  },

  // Finance rejects an approved MO.
  finance_reject: {
    from:         [MO_STATUS.APPROVED],
    to:           MO_STATUS.REJECTED,
    allowedRoles: ['finance'],
    requiresNote: true,
    actionLabel:  S.reject,
    condition:    () => true,
  },

  // PM or Secretary cancel before released.
  // Drafts are deleted, not cancelled — draft is not in the `from` list.
  cancel: {
    from:         [MO_STATUS.PENDING_CEO, MO_STATUS.APPROVED],
    to:           MO_STATUS.CANCELLED,
    allowedRoles: ['purchase_manager', 'secretary'],
    requiresNote: true,
    actionLabel:  S.cancel,
    condition:    () => true,
  },
}

// ─────────────────────────────────────────
// Helper: get available transition keys for an MO + role + userId.
// Returns an array of keys (e.g. ['ceo_approve', 'ceo_reject']).
// Consumers look up the full transition via STATUS_TRANSITIONS[key].
// ─────────────────────────────────────────
export function getAvailableTransitions(mo, role, userId) {
  if (!mo || !role) return []

  return Object.entries(STATUS_TRANSITIONS)
    .filter(([, config]) => {
      const roleAllowed   = config.allowedRoles.includes(role)
      const statusAllowed = config.from.includes(mo.status)
      const conditionMet  = config.condition(mo, userId)
      return roleAllowed && statusAllowed && conditionMet
    })
    .map(([key]) => key)
}

// ─────────────────────────────────────────
// Helper: resolve the target status for a transition, accounting for dynamic `to`.
// ─────────────────────────────────────────
export function resolveTargetStatus(transitionKey, mo) {
  const config = STATUS_TRANSITIONS[transitionKey]
  if (!config) return null
  return typeof config.to === 'function' ? config.to(mo) : config.to
}