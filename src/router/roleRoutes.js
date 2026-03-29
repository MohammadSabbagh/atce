// Defines which tabs each role sees in the bottom nav
// icon: uses a string name — map to your icon component in BottomNav

export const ROLE_ROUTES = {
  purchase_manager: [
    { path: '/dashboard', label: 'Dashboard', icon: 'home' },
    { path: '/po/create', label: 'Create PO', icon: 'plus' },
    { path: '/po/list', label: 'Orders', icon: 'list' },
    { path: '/hr/employees', label: 'Employees', icon: 'users' },
    { path: '/hr/requests/my', label: 'My Requests', icon: 'file-text' },
  ],
  secretary: [
    { path: '/dashboard', label: 'Dashboard', icon: 'home' },
    { path: '/po/create', label: 'Create PO', icon: 'plus' },
    { path: '/po/list', label: 'Orders', icon: 'list' },
  ],
  hr: [
    { path: '/hr/dashboard', label: 'Dashboard', icon: 'home' },
    { path: '/hr/employees', label: 'Employees', icon: 'users' },
    { path: '/hr/requests/fulfill', label: 'Requests', icon: 'check-square' },
  ],
  ceo: [
    { path: '/dashboard',     label: 'Dashboard', icon: 'home'       },
    { path: '/po/list',       label: 'All POs',   icon: 'list'       },
    { path: '/hr/org-chart',  label: 'Org Chart', icon: 'git-branch' },
  ],
  finance: [
    { path: '/finance/dashboard', label: 'Live', icon: 'activity' },
    { path: '/po/list', label: 'All Orders', icon: 'list' },
    { path: '/hr/org-chart', label: 'Org Chart', icon: 'git-branch' },
    { path: '/hr/approvals', label: 'HR Approvals', icon: 'user-check' },
  ],
}

// Default landing path per role
export const ROLE_HOME = {
  purchase_manager: '/dashboard',
  secretary: '/dashboard',
  hr: '/hr/dashboard',
  ceo: '/dashboard',
  finance: '/finance/dashboard',
}