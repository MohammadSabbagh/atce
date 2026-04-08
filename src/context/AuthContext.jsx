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

  // Step 1: session management — offline-first approach with reconnection handling
  useEffect(() => {
    if (IS_DEV) return

    const handleOnline = () => {
      // User came back online — refresh session from Supabase
      console.log('[Auth] Device came back online, refreshing session')
      supabase.auth.getSession()
        .then(({ data: { session } }) => {
          setSession(session)
          if (session) {
            localStorage.setItem('cached_auth_session', JSON.stringify(session))
          }
        })
        .catch((error) => {
          console.error('[Auth] getSession failed after coming online:', error.message)
        })
    }

    const handleOffline = () => {
      console.log('[Auth] Device went offline')
    }

    const initAuth = () => {
      if (!navigator.onLine) {
        // Device is offline — restore from cache immediately, skip Supabase
        console.log('[Auth] Device offline, restoring from cache')
        const cachedSession = localStorage.getItem('cached_auth_session')
        const cachedProfile = localStorage.getItem('cached_user_profile')

        if (cachedSession) {
          try {
            setSession(JSON.parse(cachedSession))
          } catch (e) {
            console.error('[Auth] Failed to parse cached session:', e)
            setSession(null)
          }
        } else {
          console.log('[Auth] No cached session available')
          setSession(null)
        }

        if (cachedProfile) {
          try {
            setProfile(JSON.parse(cachedProfile))
          } catch (e) {
            console.error('[Auth] Failed to parse cached profile:', e)
          }
        }

        setProfileReady(true)
        return // Skip Supabase calls
      }

      // Device is online — fetch from Supabase
      supabase.auth.getSession()
        .then(({ data: { session } }) => {
          setSession(session)
          if (session) {
            localStorage.setItem('cached_auth_session', JSON.stringify(session))
          }
        })
        .catch((error) => {
          console.error('[Auth] getSession failed:', error.message)
          setSession(null)
        })
    }

    // Initial auth check
    initAuth()

    // Listen for online/offline events
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // FIX: When offline, don't let Supabase null-out a cached session.
        // Supabase fires onAuthStateChange with null when token refresh fails
        // (no network), which would wipe the session we restored from cache.
        if (!navigator.onLine && !session) {
          console.log('[Auth] Ignoring null session from Supabase (offline)')
          return
        }

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

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Step 2: fetch profile whenever session has a user
  useEffect(() => {
    if (IS_DEV) return
    if (session === undefined) return // still initializing

    if (session?.user) {
      // FIX: When offline, use cached profile instead of hitting Supabase.
      // The fetch would fail and the error handler would set profile to null,
      // wiping the cached profile restored in initAuth().
      if (!navigator.onLine) {
        console.log('[Auth] Offline — using cached profile')
        const cachedProfile = localStorage.getItem('cached_user_profile')
        if (cachedProfile) {
          try {
            setProfile(JSON.parse(cachedProfile))
          } catch (e) {
            console.error('[Auth] Failed to parse cached profile:', e)
          }
        }
        setProfileReady(true)
        return
      }

      supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('[Auth] profile fetch error', error)
            // FIX: On fetch error, fall back to cached profile instead of null.
            // Covers flaky connections where navigator.onLine is true but
            // the request still fails.
            const cachedProfile = localStorage.getItem('cached_user_profile')
            if (cachedProfile) {
              try {
                setProfile(JSON.parse(cachedProfile))
              } catch (e) {
                setProfile(null)
              }
            } else {
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