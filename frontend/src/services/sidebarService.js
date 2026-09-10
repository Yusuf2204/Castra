import { CNavItem, CNavGroup } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import * as CoreUIIcons from '@coreui/icons'

const normalizeIconName = (iconName) => {
  if (!iconName) return null

  return String(iconName)
    .trim()
    .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}

const resolveIcon = (iconName) => {
  const normalizedIconName = normalizeIconName(iconName)
  const icon = CoreUIIcons[normalizedIconName]
  if (!icon) return null
  return <CIcon icon={icon} customClassName="nav-icon" />
}

/* ===============================
   FILTER PERMISSION TREE
================================ */
const filterTree = (menus) =>
  menus
    .filter((menu) => menu.checked)
    .map((menu) => ({
      ...menu,
      children: filterTree(menu.children || []),
    }))

/* ===============================
   BUILD COREUI NAV
================================ */
const buildNav = (menus) =>
  menus.map((menu) =>
    menu.children.length
      ? {
          component: CNavGroup,
          name: menu.menu_name,
          icon: resolveIcon(menu.menu_icon),
          items: buildNav(menu.children),
        }
      : {
          component: CNavItem,
          name: menu.menu_name,
          to: menu.menu_path,
          icon: resolveIcon(menu.menu_icon),
        },
  )

export const buildSidebarNavigation = (menus = []) => buildNav(filterTree(menus))
