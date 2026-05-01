import { S } from '@/lib/strings'

// Defines which tabs each role sees in the bottom nav
// icon: uses a string name — map to your icon component in BottomNav

export const ROLE_ROUTES = {
  purchase_manager: [
    { path: '/dashboard', label: S.navDashboard, icon: 'home' },
    { path: '/po/list',   label: S.navPOList,    icon: 'list' },
    { path: '/mo', label: S.moListTitle, icon: 'wrench'}
  ],
  secretary: [
    { path: '/dashboard', label: S.navDashboard, icon: 'home' },
    { path: '/po/list',   label: S.navPOList,    icon: 'list' },
    { path: '/mo', label: S.moListTitle, icon: 'wrench'}
  ],
  hr: [
    { path: '/hr/dashboard', label: S.navDashboard, icon: 'home' },
    { path: '/po/list',      label: S.navPOList,    icon: 'list' },
    { path: '/mo', label: S.moListTitle, icon: 'wrench'}
  ],
  ceo: [
    { path: '/dashboard', label: S.navDashboard, icon: 'home' },
    { path: '/po/list',   label: S.navPOList,    icon: 'list' },
    { path: '/mo', label: S.moListTitle, icon: 'wrench'}
  ],
  finance: [
    { path: '/dashboard', label: S.navDashboard, icon: 'home' },
    { path: '/po/list',   label: S.navPOList,    icon: 'list' },
    { path: '/mo', label: S.moListTitle, icon: 'wrench'}
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