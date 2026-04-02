import { S } from '@/lib/strings'

// Defines which tabs each role sees in the bottom nav
// icon: uses a string name — map to your icon component in BottomNav

export const ROLE_ROUTES = {
  purchase_manager: [
    { path: '/dashboard', label: S.nav.dashboard, icon: 'home' },
    { path: '/po/list',   label: S.nav.orders,    icon: 'list' },
  ],
  secretary: [
    { path: '/dashboard', label: S.nav.dashboard, icon: 'home' },
    { path: '/po/list',   label: S.nav.orders,    icon: 'list' },
  ],
  hr: [
    { path: '/hr/dashboard', label: S.nav.dashboard, icon: 'home' },
    { path: '/po/list',      label: S.nav.orders,    icon: 'list' },
  ],
  ceo: [
    { path: '/dashboard', label: S.nav.dashboard, icon: 'home' },
    { path: '/po/list',   label: S.nav.allPOs,    icon: 'list' },
  ],
  finance: [
    { path: '/finance/dashboard', label: S.nav.dashboard, icon: 'home' },
    { path: '/po/list',           label: S.nav.allOrders, icon: 'list' },
  ],
}

// Default landing path per role
export const ROLE_HOME = {
  purchase_manager: '/dashboard',
  secretary:        '/dashboard',
  hr:               '/hr/dashboard',
  ceo:              '/dashboard',
  finance:          '/finance/dashboard',
}