import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilArrowBottom,
  cilArrowTop,
  cilChartLine,
  cilGrid,
} from '@coreui/icons'

const AppBottomNav = () => {
  const location = useLocation()
  const dispatch = useDispatch()
  const sidebarShow = useSelector((state) => state.sidebarShow)

  const navItems = [
    {
      to: '/dashboard',
      label: 'Home',
      icon: cilSpeedometer,
      isActive: (path) => path === '/dashboard' || path === '/',
    },
    {
      to: '/expenses',
      label: 'Pengeluaran',
      icon: cilArrowBottom,
      color: 'danger',
      isActive: (path) => path.startsWith('/expenses'),
    },
    {
      to: '/incomes',
      label: 'Pemasukan',
      icon: cilArrowTop,
      color: 'success',
      isActive: (path) => path.startsWith('/incomes'),
    },
    {
      to: '/reports',
      label: 'Laporan',
      icon: cilChartLine,
      color: 'primary',
      isActive: (path) => path.startsWith('/reports'),
    },
  ]

  const isMoreActive =
    sidebarShow ||
    location.pathname.startsWith('/master') ||
    location.pathname.startsWith('/setup') ||
    location.pathname.startsWith('/profile')

  const handleToggleMore = () => {
    dispatch({ type: 'set', sidebarShow: !sidebarShow })
  }

  return (
    <nav className="app-bottom-nav d-flex d-md-none position-fixed bottom-0 start-0 end-0 bg-body border-top shadow-lg">
      {navItems.map((item) => {
        const active = item.isActive(location.pathname)
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={`app-bottom-nav-item flex-grow-1 text-center py-2 text-decoration-none ${
              active ? 'active fw-bold' : 'text-body-secondary'
            }`}
          >
            <div className={`nav-icon-wrapper mb-1 ${active ? (item.color ? `text-${item.color}` : 'text-primary') : ''}`}>
              <CIcon icon={item.icon} size="lg" />
            </div>
            <span className="nav-label small d-block" style={{ fontSize: '0.70rem', lineHeight: 1 }}>
              {item.label}
            </span>
          </NavLink>
        )
      })}

      <button
        type="button"
        onClick={handleToggleMore}
        className={`app-bottom-nav-item flex-grow-1 text-center py-2 text-decoration-none border-0 bg-transparent ${
          isMoreActive ? 'active fw-bold text-primary' : 'text-body-secondary'
        }`}
      >
        <div className={`nav-icon-wrapper mb-1 ${isMoreActive ? 'text-primary' : ''}`}>
          <CIcon icon={cilGrid} size="lg" />
        </div>
        <span className="nav-label small d-block" style={{ fontSize: '0.70rem', lineHeight: 1 }}>
          Menu
        </span>
      </button>
    </nav>
  )
}

export default AppBottomNav
