import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ROLE_HOME } from '@/router/roleRoutes'
import '@/styles/login.scss'

export default function LoginScreen() {
  const { signIn, authError } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState(null)

  const handleSubmit = async () => {
    if (!email || !password) {
      setLocalError('Email and password are required.')
      return
    }
    setLocalError(null)
    setLoading(true)
    try {
      await signIn(email, password)
      // profile + role now set via onAuthStateChange
      // We can't read role here yet — AppRouter will redirect
      //navigate('/', { replace: true })
    } catch {
      // authError is set in context
    } finally {
      setLoading(false)
    }
  }

  const error = localError || authError

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__header">
          <span className="login__logo">PO</span>
          <h1 className="login__title">Sign in</h1>
          <p className="login__subtitle">Purchase & HR Management</p>
        </div>

        <div className="login__fields">
          <div className="login__field">
            <label className="login__label">Email</label>
            <input
              className="login__input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="you@company.com"
            />
          </div>

          <div className="login__field">
            <label className="login__label">Password</label>
            <input
              className="login__input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="login__error">{error}</p>}

          <button
            className="login__btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}