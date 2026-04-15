export const DEPARTMENTS = [
  'اداري',
  'مالي',
  'طاقة',
  'طبي تجاري',
  'طبي فني',
  'طبي مبيعات',
]

export const ROLES = {
  PURCHASE_MANAGER: 'purchase_manager',
  SECRETARY: 'secretary',
  HR: 'hr',
  CEO: 'ceo',
  FINANCE: 'finance',
}

export const PO_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}

export const ER_STATUSES = {
  OPEN: 'open',
  FULFILLED: 'fulfilled',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}

// Display labels
export const ROLE_LABELS = {
  purchase_manager: 'Purchase Manager',
  secretary: 'Secretary',
  hr: 'HR Department',
  ceo: 'CEO',
  finance: 'Finance',
}

// Mock users for dev bypass — one per role
export const MOCK_USERS = [
  {
    id: 'mock-pm-001',
    full_name: 'Alaa Mansour',
    role: 'purchase_manager',
    department: 'Operations',
  },
  {
    id: 'mock-sec-001',
    full_name: 'Layla Hassan',
    role: 'secretary',
    department: 'Operations',
  },
  {
    id: 'mock-hr-001',
    full_name: 'Nour Khalil',
    role: 'hr',
    department: 'HR',
  },
  {
    id: 'mock-ceo-001',
    full_name: 'Marwan Idris',
    role: 'ceo',
    department: null,
  },
  {
    id: 'mock-fin-001',
    full_name: 'Ahmad Farhat',
    role: 'finance',
    department: 'Finance',
  },
]