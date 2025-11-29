// Sidebar.tsx
import React from 'react'
import type { SidebarProps } from '../../Dashboard.types'
import './Sidebar.styles.scss'

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  menuItems,
  activeMenuItem,
  onMenuItemClick,
  onSave,
  isSaving,
  onNeedHelp,
  isOpen = false,
}) => {
  // Generate initials from name
  const getInitials = (name: string): string => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <aside className={`dashboard-sidebar ${isOpen ? 'dashboard-sidebar--open' : ''}`}>
      {/* User Info */}
      <div className="dashboard-sidebar__user">
        <div className="dashboard-sidebar__avatar">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} />
          ) : (
            <span className="dashboard-sidebar__avatar-initials">
              {getInitials(user.name)}
            </span>
          )}
        </div>
        <div className="dashboard-sidebar__user-info">
          <span className="dashboard-sidebar__user-name">{user.name}</span>
          <span className="dashboard-sidebar__user-plan">{user.plan}</span>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="dashboard-sidebar__nav">
        <ul className="dashboard-sidebar__menu">
          {menuItems.map((item) => (
            <li key={item.id} className="dashboard-sidebar__menu-item">
              <button
                type="button"
                className={`dashboard-sidebar__menu-btn ${
                  activeMenuItem === item.id ? 'dashboard-sidebar__menu-btn--active' : ''
                }`}
                onClick={() => onMenuItemClick(item.id)}
              >
                <span className="dashboard-sidebar__menu-icon">{item.icon}</span>
                <span className="dashboard-sidebar__menu-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Need Help Link */}
      <button
        type="button"
        className="dashboard-sidebar__help"
        onClick={onNeedHelp}
      >
        Need Help?
      </button>

      {/* Save Button */}
      <button
        type="button"
        className="dashboard-sidebar__save"
        onClick={onSave}
        disabled={isSaving}
      >
        {isSaving ? 'Saving...' : 'Save'}
      </button>
    </aside>
  )
}

export default Sidebar

