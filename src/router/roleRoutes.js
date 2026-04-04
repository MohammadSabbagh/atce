import { S } from '@/lib/strings'

// Defines which tabs each role sees in the bottom nav
// icon: uses a string name — map to your icon component in BottomNav

export const ROLE_ROUTES = {
  purchase_manager: [
    { path: '/dashboard', label: S.navDashboard, icon: 'home' },
    { path: '/po/list',   label: S.navPOList,    icon: 'list' },
  ],
  secretary: [
    { path: '/dashboard', label: S.navDashboard, icon: 'home' },
    { path: '/po/list',   label: S.navPOList,    icon: 'list' },
  ],
  hr: [
    { path: '/hr/dashboard', label: S.navDashboard, icon: 'home' },
    { path: '/po/list',      label: S.navPOList,    icon: 'list' },
  ],
  ceo: [
    { path: '/dashboard', label: S.navDashboard, icon: 'home' },
    { path: '/po/list',   label: S.navPOList,    icon: 'list' },
  ],
  finance: [
    { path: '/dashboard', label: S.navDashboard, icon: 'home' },
    { path: '/po/list',   label: S.navPOList,    icon: 'list' },
  ],
}

// Default landing path per role
export const ROLE_HOME = {
  purchase_manager: '/dashboard',
  secretary:        '/dashboard',
  hr:               '/hr/dashboard',
  ceo:              '/dashboard',
  finance:          '/dashboard',
}