// poStatusConfig.js
// Single source of truth for PO status flow, labels, colors, and transition rules.
// All status-related logic in the app derives from this file.

// ─────────────────────────────────────────
// Status definitions
// ─────────────────────────────────────────
export const PO_STATUS = {
  PENDING:     'pending',
  APPROVED:    'approved',
  RELEASED:    'released',
  REJECTED:    'rejected',
  RESUBMITTED: 'resubmitted',
  CANCELLED:   'cancelled',
}

// ─────────────────────────────────────────
// Display config per status
// label: Arabic UI string
// color: maps to $variable token in SCSS
// cssClass: BEM modifier for status badges
// ─────────────────────────────────────────
export const STATUS_CONFIG = {
  [PO_STATUS.PENDING]: {
    label:    'قيد الانتظار',
    cssClass: 'pending',
    color:    'amber',
  },
  [PO_STATUS.APPROVED]: {
    label:    'معتمد — بانتظار الإصدار',
    cssClass: 'approved',
    color:    'blue',
  },
  [PO_STATUS.RELEASED]: {
    label:    'صدر',
    cssClass: 'released',
    color:    'green',
  },
  [PO_STATUS.REJECTED]: {
    label:    'مرفوض',
    cssClass: 'rejected',
    color:    'red',
  },
  [PO_STATUS.RESUBMITTED]: {
    label:    'أُعيد تقديمه',
    cssClass: 'resubmitted',
    color:    'purple',
  },
  [PO_STATUS.CANCELLED]: {
    label:    'ملغى',
    cssClass: 'cancelled',
    color:    'muted',
  },
}

// ─────────────────────────────────────────
// Flow rules
// Defines which roles can perform which transitions
// and whether a note is required
// ─────────────────────────────────────────
export const STATUS_TRANSITIONS = {
  // CEO: approve requires_ceo POs (pending or resubmitted)
  ceo_approve: {
    from:         [PO_STATUS.PENDING, PO_STATUS.RESUBMITTED],
    to:           PO_STATUS.APPROVED,
    allowedRoles: ['ceo'],
    requiresNote: false,
    condition:    (po) => po.requires_ceo === true,
  },

  // CEO: reject requires_ceo POs
  ceo_reject: {
    from:         [PO_STATUS.PENDING, PO_STATUS.RESUBMITTED],
    to:           PO_STATUS.REJECTED,
    allowedRoles: ['ceo'],
    requiresNote: true,
    condition:    (po) => po.requires_ceo === true,
  },

  // Finance: release approved POs (came through CEO)
  finance_release_from_approved: {
    from:         [PO_STATUS.APPROVED],
    to:           PO_STATUS.RELEASED,
    allowedRoles: ['finance'],
    requiresNote: false,
    condition:    () => true,
  },

  // Finance: release pending POs that don't need CEO
  finance_release_from_pending: {
    from:         [PO_STATUS.PENDING, PO_STATUS.RESUBMITTED],
    to:           PO_STATUS.RELEASED,
    allowedRoles: ['finance'],
    requiresNote: false,
    condition:    (po) => po.requires_ceo === false,
  },

  // Finance: reject any non-released PO
  finance_reject: {
    from:         [PO_STATUS.PENDING, PO_STATUS.APPROVED, PO_STATUS.RESUBMITTED],
    to:           PO_STATUS.REJECTED,
    allowedRoles: ['finance'],
    requiresNote: true,
    condition:    () => true,
  },

  // PM/Secretary: resubmit a rejected PO
  resubmit: {
    from:         [PO_STATUS.REJECTED],
    to:           PO_STATUS.RESUBMITTED,
    allowedRoles: ['purchase_manager', 'secretary'],
    requiresNote: true,
    condition:    (po, userId) => po.created_by === userId,
  },

  // PM/Secretary: cancel own PO before it is released
  cancel: {
    from:         [PO_STATUS.PENDING, PO_STATUS.APPROVED, PO_STATUS.RESUBMITTED],
    to:           PO_STATUS.CANCELLED,
    allowedRoles: ['purchase_manager', 'secretary'],
    requiresNote: false,
    condition:    (po, userId) => po.created_by === userId,
  },
}

// ─────────────────────────────────────────
// Helper: get available transitions for a PO given role + userId
// Returns array of transition keys the user can perform
// ─────────────────────────────────────────
export function getAvailableTransitions(po, role, userId) {
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
// Helper: get label for a status key
// ─────────────────────────────────────────
export function getStatusLabel(status) {
  return STATUS_CONFIG[status]?.label ?? status
}

// ─────────────────────────────────────────
// Helper: get CSS modifier class for a status
// ─────────────────────────────────────────
export function getStatusClass(status) {
  return STATUS_CONFIG[status]?.cssClass ?? 'unknown'
}

// ─────────────────────────────────────────
// Dashboard filter presets
// Used by stat cards to navigate to PO list
// with the correct filter pre-applied
// ─────────────────────────────────────────
export const DASHBOARD_FILTERS = {
  CEO_PENDING: {
    status:      PO_STATUS.PENDING,
    requires_ceo: true,
    label:       'بانتظار موافقة الرئيس',
  },
  FINANCE_PENDING: {
    // Two conditions — handled in useDashboard query
    // status=approved OR (status=pending AND requires_ceo=false)
    label: 'بانتظار الإصدار',
    queryKey: 'finance_pending',
  },
  REJECTED: {
    status: PO_STATUS.REJECTED,
    label:  'مرفوضة',
  },
  AWAITING_VALUE: {
    status: PO_STATUS.PENDING,
    label:  'إجمالي القيمة المعلقة',
  },
}