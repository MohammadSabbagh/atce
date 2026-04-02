import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { MOCK_USERS } from '@/lib/constants'

const AuthContext = createContext(null)

const IS_DEV = import.meta.env.VITE_DEV_MODE === 'true'
const DEFAULT_MOCK_USER = MOCK_USERS[0]

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)  // undefined = not yet known
  const [profile, setProfile] = useState(IS_DEV ? DEFAULT_MOCK_USER : null)
  const [profileReady, setProfileReady] = useState(IS_DEV) // true once profile fetch completes
  const [authError, setAuthError] = useState(null)

  // Step 1: session management only
  useEffect(() => {
    if (IS_DEV) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        // When session changes (e.g. sign out), reset profileReady
        // so loading gate re-engages until profile resolves
        if (!session) {
          setProfileReady(true) // no session = no profile needed, ready immediately
        } else {
          setProfileReady(false) // new session = need to re-fetch profile
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Step 2: fetch profile whenever session has a user
  useEffect(() => {
    if (IS_DEV) return
    if (session === undefined) return // still initializing

    if (session?.user) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('[Auth] profile fetch error', error)
            setProfile(null)
          } else {
            setProfile(data)
          }
          setProfileReady(true) // done either way
        })
    } else {
      setProfile(null)
      setProfileReady(true)
    }
  }, [session])

  // loading = true until BOTH session is known AND profile fetch is complete
  const loading = session === undefined || !profileReady

  const signIn = async (email, password) => {
    setAuthError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setAuthError(error.message)
      throw error
    }
  }

  const signOut = async () => {
    if (IS_DEV) {
      setProfile(null)
      return
    }
    await supabase.auth.signOut()
  }

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
    loading,
    authError,
    signIn,
    signOut,
    switchRole,
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