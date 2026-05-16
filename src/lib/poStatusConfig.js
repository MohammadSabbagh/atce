// poStatusConfig.js
// Single source of truth for PO status flow and transition rules.
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
export const PO_STATUS = {
  DRAFT:       'draft',
  PENDING_CEO: 'pending_ceo',
  APPROVED:    'approved',
  RELEASED:    'released',
  REJECTED:    'rejected',
  CANCELLED:   'cancelled',
}

// ─────────────────────────────────────────
// Flow rules — keyed by action id for stable references in audit_log,
// analytics, and component code.
//
// Each entry shape:
//   from         : status the PO must be in (string or array)
//   to           : target status — string OR (po) => string
//                  (dynamic when the same user action branches based on the PO)
//   allowedRoles : roles permitted to perform this action
//   requiresNote : whether a note is mandatory
//   actionLabel  : Arabic button text (single source of truth across PO/MO)
//   condition    : extra predicate beyond from/role; must return true to enable
//
// Resolve dynamic `to` at the call site:
//   const target = typeof t.to === 'function' ? t.to(po) : t.to
// ─────────────────────────────────────────
export const STATUS_TRANSITIONS = {
  // PM confirms draft. System picks the next status based on requires_ceo.
  //   requires_ceo = true  → pending_ceo
  //   requires_ceo = false → approved
  pm_confirm: {
    from:         [PO_STATUS.DRAFT],
    to:           (po) => (po.requires_ceo ? PO_STATUS.PENDING_CEO : PO_STATUS.APPROVED),
    allowedRoles: ['purchase_manager'],
    requiresNote: false,
    actionLabel:  S.pmConfirm,
    condition:    () => true,
  },

  // CEO approves a pending_ceo PO.
  ceo_approve: {
    from:         [PO_STATUS.PENDING_CEO],
    to:           PO_STATUS.APPROVED,
    allowedRoles: ['ceo'],
    requiresNote: false,
    actionLabel:  S.approve,
    condition:    () => true,
  },

  // CEO rejects a pending_ceo PO.
  ceo_reject: {
    from:         [PO_STATUS.PENDING_CEO],
    to:           PO_STATUS.REJECTED,
    allowedRoles: ['ceo'],
    requiresNote: true,
    actionLabel:  S.reject,
    condition:    () => true,
  },

  // Finance releases an approved PO.
  finance_release: {
    from:         [PO_STATUS.APPROVED],
    to:           PO_STATUS.RELEASED,
    allowedRoles: ['finance'],
    requiresNote: false,
    actionLabel:  S.release,
    condition:    () => true,
  },

  // Finance rejects an approved PO.
  // Note: Finance can reject any approved PO, including those that came from CEO.
  // If you want to forbid Finance from overriding CEO approval, add a condition here.
  finance_reject: {
    from:         [PO_STATUS.APPROVED],
    to:           PO_STATUS.REJECTED,
    allowedRoles: ['finance'],
    requiresNote: true,
    actionLabel:  S.reject,
    condition:    () => true,
  },

  // PM or Secretary cancel before released.
  // Drafts are deleted, not cancelled — draft is not in the `from` list.
  cancel: {
    from:         [PO_STATUS.PENDING_CEO, PO_STATUS.APPROVED],
    to:           PO_STATUS.CANCELLED,
    allowedRoles: ['purchase_manager', 'secretary'],
    requiresNote: true,
    actionLabel:  S.cancel,
    condition:    () => true,
  },
}

// ─────────────────────────────────────────
// Helper: get available transition keys for a PO + role + userId.
// Returns an array of keys (e.g. ['ceo_approve', 'ceo_reject']).
// Consumers look up the full transition via STATUS_TRANSITIONS[key].
// ─────────────────────────────────────────
export function getAvailableTransitions(po, role, userId) {
  if (!po || !role) return []

  return Object.entries(STATUS_TRANSITIONS)
    .filter(([, config]) => {
      const roleAllowed   = config.allowedRoles.includes(role)
      const statusAllowed = config.from.includes(po.status)
      const conditionMet  = config.condition(po, userId)
      return roleAllowed && statusAllowed && conditionMet
    })
    .map(([key]) => key)
}

// ─────────────────────────────────────────
// Helper: resolve the target status for a transition, accounting for dynamic `to`.
// ─────────────────────────────────────────
export function resolveTargetStatus(transitionKey, po) {
  const config = STATUS_TRANSITIONS[transitionKey]
  if (!config) return null
  return typeof config.to === 'function' ? config.to(po) : config.to
}