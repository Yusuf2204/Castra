import React, { useCallback, useEffect, useState } from 'react'
import { CFormSwitch, CButton, CSpinner } from '@coreui/react'
import { useDispatch, useSelector } from 'react-redux'
import api from '../../../services/api'
import { toastError, toastSuccess } from '../../../services/toastService'

const RolepermissionsForm = ({ role }) => {
  const dispatch = useDispatch()
  const currentUser = useSelector((state) => state.user)
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/role-menus/${role.id}`)
      setMenus(res.data.data)
    } finally {
      setLoading(false)
    }
  }, [role.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  // recursive toggle
  const toggleMenu = (list, id) =>
    list.map((menu) => {
      if (menu.id === id) {
        return { ...menu, checked: !menu.checked }
      }

      if (menu.children?.length) {
        return {
          ...menu,
          children: toggleMenu(menu.children, id),
        }
      }

      return menu
    })

  const toggle = (id) => {
    setMenus((prev) => toggleMenu(prev, id))
  }

  // flatten checked ids
  const collectChecked = (list, result = []) => {
    list.forEach((menu) => {
      if (menu.checked) result.push(menu.id)
      if (menu.children?.length) collectChecked(menu.children, result)
    })
    return result
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const menuIds = collectChecked(menus)

      await api.post(`/role-menus/${role.id}`, {
        menu_ids: menuIds,
      })

      if (Number(currentUser?.role_id) === Number(role.id)) {
        const response = await api.get(`/role-menus/${role.id}`)
        dispatch({
          type: 'set',
          navigation: response.data.data,
        })
      }

      toastSuccess('Permissions updated')
    } catch (err) {
      toastError(err.userMessage || 'Failed to save permissions')
    } finally {
      setSaving(false)
    }
  }

  const renderMenu = (menu, depth = 0) => (
    <div key={menu.id} style={{ paddingLeft: depth * 20 }}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <strong>{menu.menu_name}</strong>
        <CFormSwitch checked={menu.checked} onChange={() => toggle(menu.id)} disabled={saving} />
      </div>

      {menu.children?.map((child) => renderMenu(child, depth + 1))}
    </div>
  )

  if (loading) {
    return (
      <div className="d-flex align-items-center text-body-secondary py-3">
        <CSpinner size="sm" className="me-2" />
        Loading permissions...
      </div>
    )
  }

  return (
    <>
      {menus.map((menu) => renderMenu(menu))}

      <CButton color="primary" className="mt-3" onClick={handleSave} disabled={saving}>
        {saving ? (
          <>
            <CSpinner size="sm" className="me-2" />
            Saving...
          </>
        ) : (
          'Save Permissions'
        )}
      </CButton>
    </>
  )
}

export default RolepermissionsForm
