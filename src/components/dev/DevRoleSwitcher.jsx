import { useAuth } from '@/context/AuthContext'
import { MOCK_USERS, ROLE_LABELS } from '@/lib/constants'
import { useNavigate } from 'react-router-dom'
import { ROLE_HOME } from '@/router/roleRoutes'
import '@/styles/dev-switcher.scss'

export default function DevRoleSwitcher() {
  const { role, switchRole } = useAuth()
  const navigate = useNavigate()

  const handleSwitch = (newRole) => {
    switchRole(newRole)
    navigate(ROLE_HOME[newRole])
  }

  return (
    <div className="dev-switcher">
      <span className="dev-switcher__label">DEV</span>
      {MOCK_USERS.map((u) => (
        <button
          key={u.role}
          className={`dev-switcher__btn ${u.role === role ? 'dev-switcher__btn--active' : ''}`}
          onClick={() => handleSwitch(u.role)}
          title={u.full_name}
        >
          {u.role.slice(0, 3).toUpperCase()}
        </button>
      ))}
    </div>
  )
}