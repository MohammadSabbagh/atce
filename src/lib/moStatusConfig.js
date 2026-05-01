// src/lib/moStatusConfig.js
// Single source of truth for MO status TRANSITION logic.
// Mirrors poStatusConfig.js — same two-path lifecycle, same roles.
//
// Status labels live in src/lib/strings.js (S.statusDraft, S.statusPending, …)
// Action button labels also live in strings.js (S.pmConfirm, S.approve, …)
// Render badges via <StatusBadge status={...} /> — never with a local class.

import { S } from './strings'

export const MO_STATUSES = {
  DRAFT:     'draft',
  PENDING:   'pending',
  APPROVED:  'approved',
  RELEASED:  'released',
  REJECTED:  'rejected',
  CANCELLED: 'cancelled',
}

/**
 * STATUS_TRANSITIONS
 *
 * Two paths based on requires_ceo — identical to PO lifecycle:
 *
 * CEO path (requires_ceo = true):
 *   draft → pending (PM confirms)
 *   pending → approved (CEO)
 *   approved → released (Finance)
 *   pending/approved → rejected (CEO or Finance*)
 *   pending/approved → cancelled (PM/Secretary)
 *
 * Direct path (requires_ceo = false):
 *   draft → pending (PM confirms)
 *   pending → released (Finance directly)
 *   pending → rejected (Finance)
 *   pending → cancelled (PM/Secretary)
 *
 * * Finance cannot reject CEO-approved MOs (requires_ceo=true + status=approved)
 */
export const STATUS_TRANSITIONS = [
  // PM confirms draft
  {
    from: 'draft',
    to: 'pending',
    roles: ['purchase_manager'],
    requiresNote: false,
    actionLabel: S.pmConfirm,
  },

  // CEO approves (CEO path only — enforced in getAvailableTransitions)
  {
    from: 'pending',
    to: 'approved',
    roles: ['ceo'],
    requiresNote: false,
    actionLabel: S.approve,
  },

  // Finance releases — CEO path (approved → released)
  {
    from: 'approved',
    to: 'released',
    roles: ['finance'],
    requiresNote: false,
    actionLabel: S.release,
  },

  // Finance releases — direct path (pending → released, requires_ceo=false only)
  // Enforced via requires_ceo check in getAvailableTransitions
  {
    from: 'pending',
    to: 'released',
    roles: ['finance'],
    requiresNote: false,
    actionLabel: S.release,
  },

  // CEO rejects pending (CEO path)
  {
    from: 'pending',
    to: 'rejected',
    roles: ['ceo'],
    requiresNote: true,
    actionLabel: S.reject,
  },

  // Finance rejects pending (direct path only — enforced in getAvailableTransitions)
  {
    from: 'pending',
    to: 'rejected',
    roles: ['finance'],
    requiresNote: true,
    actionLabel: S.reject,
  },

  // Finance rejects approved (direct path only — cannot reject CEO-approved)
  {
    from: 'approved',
    to: 'rejected',
    roles: ['finance'],
    requiresNote: true,
    actionLabel: S.reject,
  },

  // PM/Secretary cancel before released
  {
    from: 'pending',
    to: 'cancelled',
    roles: ['purchase_manager', 'secretary'],
    requiresNote: true,
    actionLabel: S.cancel,
  },
  {
    from: 'approved',
    to: 'cancelled',
    roles: ['purchase_manager', 'secretary'],
    requiresNote: true,
    actionLabel: S.cancel,
  },
]

/**
 * Returns available transitions for the current user on a given MO.
 *
 * @param {object} mo        - The maintenance order row (needs: status, requires_ceo, created_by)
 * @param {string} role      - Current user's role
 * @param {string} userId    - Current user's ID
 * @returns {Array}          - Filtered list of transition objects
 */
export function getAvailableTransitions(mo, role, userId) {
  if (!mo || !role) return []

  const terminal = ['released', 'rejected', 'cancelled']
  if (terminal.includes(mo.status)) return []

  return STATUS_TRANSITIONS.filter((t) => {
    // Must match current status and role
    if (t.from !== mo.status) return false
    if (!t.roles.includes(role)) return false

    // CEO can only approve/reject requires_ceo MOs
    if (role === 'ceo' && !mo.requires_ceo) return false

    // Finance: pending → released only on direct path (requires_ceo = false)
    if (role === 'finance' && t.from === 'pending' && t.to === 'released') {
      if (mo.requires_ceo) return false
    }

    // Finance: pending → rejected only on direct path
    if (role === 'finance' && t.from === 'pending' && t.to === 'rejected') {
      if (mo.requires_ceo) return false
    }

    // Finance: cannot reject CEO-approved MOs
    if (role === 'finance' && t.from === 'approved' && t.to === 'rejected') {
      if (mo.requires_ceo) return false
    }

    return true
  })
}