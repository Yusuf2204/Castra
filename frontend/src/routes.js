import React from 'react'

// Dashboard
const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))

// Setup
const Company = React.lazy(() => import('./views/setup/company/Company'))
const Users = React.lazy(() => import('./views/setup/users/Users'))
const Roles = React.lazy(() => import('./views/setup/roles/Roles'))
const Menus = React.lazy(() => import('./views/setup/menus/Menus'))
const RolePermissions = React.lazy(() => import('./views/setup/rolePermissions/Rolepermissions'))
const ChangePassword = React.lazy(() => import('./views/setup/changePassword/Changepassword'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },

  // Setup
  { path: '/setup/users', name: 'Users', element: Users },
  { path: '/setup/roles', name: 'Roles', element: Roles },
  { path: '/setup/menus', name: 'Menus', element: Menus },
  { path: '/setup/role-permissions', name: 'Role Permissions', element: RolePermissions },
  { path: '/setup/change-password', name: 'Change Password', element: ChangePassword },
  { path: '/setup/company', name: 'Company', element: Company },
]

export default routes
