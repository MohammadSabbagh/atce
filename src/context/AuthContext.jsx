import { createContext, useContext, useState } from 'react'
import { MOCK_USERS } from '@/lib/constants'

const AuthContext = createContext(null)

const IS_DEV = import.meta.env.VITE_DEV_MODE === 'true'

// Default to purchase_manager in dev
const DEFAULT_MOCK_USER = MOCK_USERS[0]

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(
    IS_DEV ? DEFAULT_MOCK_USER : null
  )

  const switchRole = (role) => {
    if (!IS_DEV) return
    const user = MOCK_USERS.find((u) => u.role === role)
    if (user) setProfile(user)
  }

  const value = {
    profile,
    role: profile?.role ?? null,
    isAuthenticated: !!profile,
    isDev: IS_DEV,
    switchRole,
    // Placeholders — wired to Supabase in Phase 4
    signIn: async () => {},
    signOut: async () => { setProfile(null) },
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}