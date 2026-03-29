import { NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ROLE_ROUTES } from '@/router/roleRoutes'
import NavIcon from './NavIcon'
import '@/styles/bottom-nav.scss'

export default function BottomNav() {
  const { role } = useAuth()
  const tabs = ROLE_ROUTES[role] ?? []

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) =>
            `bottom-nav__tab ${isActive ? 'bottom-nav__tab--active' : ''}`
          }
        >
          <NavIcon name={tab.icon} />
          <span className="bottom-nav__label">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}