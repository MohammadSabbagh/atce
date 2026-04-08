import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { MOCK_USERS } from '@/lib/constants'
import { clearCache, stopSync } from '@/lib/poSync'

const AuthContext = createContext(null)

const IS_DEV = import.meta.env.VITE_DEV_MODE === 'true'
const DEFAULT_MOCK_USER = MOCK_USERS[0]

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)  // undefined = not yet known
  const [profile, setProfile] = useState(IS_DEV ? DEFAULT_MOCK_USER : null)
  const [profileReady, setProfileReady] = useState(IS_DEV) // true once profile fetch completes
  const [authError, setAuthError] = useState(null)

  // Step 1: session management only — with localStorage fallback for offline only
  useEffect(() => {
    if (IS_DEV) return

    const isActuallyOffline = () => !navigator.onLine

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session)
        // Cache successful session to localStorage
        if (session) {
          localStorage.setItem('cached_auth_session', JSON.stringify(session))
        }
      })
      .catch((error) => {
        // Only use cache if actually offline
        if (isActuallyOffline()) {
          console.warn('[Auth] Device offline, checking localStorage for cached session')
          const cached = localStorage.getItem('cached_auth_session')
          if (cached) {
            try {
              const parsedSession = JSON.parse(cached)
              setSession(parsedSession)
              console.log('[Auth] Restored session from cache (offline mode)')
            } catch (e) {
              console.error('[Auth] Failed to parse cached session:', e)
              setSession(null)
            }
          } else {
            console.log('[Auth] No cached session available offline')
            setSession(null)
          }
        } else {
          // Online but got error — treat as real auth failure
          console.error('[Auth] getSession failed while online:', error.message)
          setSession(null)
        }
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(prev => {
          // Only reset profileReady if the user identity changed
          if (session?.user?.id !== prev?.user?.id) {
            if (!session) {
              setProfileReady(true)
              localStorage.removeItem('cached_auth_session')
            } else {
              setProfileReady(false)
              localStorage.setItem('cached_auth_session', JSON.stringify(session))
            }
          }
          return session
        })
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
            // If offline, try localStorage cache
            if (!navigator.onLine) {
              const cached = localStorage.getItem('cached_user_profile')
              if (cached) {
                try {
                  const parsedProfile = JSON.parse(cached)
                  setProfile(parsedProfile)
                  console.log('[Auth] Using cached profile (offline mode)')
                } catch (e) {
                  console.error('[Auth] Failed to parse cached profile:', e)
                  setProfile(null)
                }
              } else {
                console.log('[Auth] No cached profile available offline')
                setProfile(null)
              }
            } else {
              // Online but got error — real auth failure
              console.error('[Auth] Profile fetch failed while online')
              setProfile(null)
            }
          } else {
            setProfile(data)
            // Cache successful profile to localStorage
            if (data) {
              localStorage.setItem('cached_user_profile', JSON.stringify(data))
            }
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
    stopSync()
    await clearCache()
    if (IS_DEV) {
      setProfile(null)
      return
    }
    localStorage.removeItem('cached_auth_session')
    localStorage.removeItem('cached_user_profile')
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