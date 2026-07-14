import React, { useEffect, useState } from 'react'
import { CForm, CFormInput, CButton, CSpinner } from '@coreui/react'
import Select from 'react-select'
import api from '../../../services/api'
import { toastSuccess } from '../../../services/toastService'
import { getFieldError } from '../../../utils/formErrors'

const MenusForm = ({ menu, menus, onReset, onSaved }) => {
  const [form, setForm] = useState({
    menu_name: '',
    menu_path: '',
    menu_icon: '',
    menu_parent_id: null,
    menu_order: 0,
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const parentOptions = menus
    .filter((m) => !menu || m.id !== menu.id)
    .map((m) => ({
      value: m.id,
      label: m.menu_name,
    }))

  useEffect(() => {
    if (menu) {
      setForm({
        menu_name: menu.menu_name,
        menu_path: menu.menu_path,
        menu_icon: menu.menu_icon || '',
        menu_parent_id: menu.menu_parent_id || null,
        menu_order: menu.menu_order || 0,
      })
    } else {
      setForm({
        menu_name: '',
        menu_path: '',
        menu_icon: '',
        menu_parent_id: null,
        menu_order: 0,
      })
    }
  }, [menu])

  const handleChange = (e) => {
    setErrors({ ...errors, [e.target.name]: null })
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleParentChange = (selected) => {
    setErrors({ ...errors, menu_parent_id: null })
    setForm({ ...form, menu_parent_id: selected ? selected.value : null })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})

    try {
      if (menu) {
        await api.put(`/menus/${menu.id}`, form)
        toastSuccess('Menu updated')
      } else {
        await api.post('/menus', form)
        toastSuccess('Menu created')
      }

      onSaved()
      onReset()
    } catch (err) {
      setErrors(err.validationErrors || {})
    } finally {
      setSaving(false)
    }
  }

  return (
    <CForm onSubmit={handleSubmit}>
      <CFormInput
        label="Menu Name"
        name="menu_name"
        value={form.menu_name}
        onChange={handleChange}
        invalid={Boolean(getFieldError(errors, 'menu_name'))}
        feedbackInvalid={getFieldError(errors, 'menu_name')}
        disabled={saving}
        className="mb-3"
      />

      <CFormInput
        label="Path"
        name="menu_path"
        value={form.menu_path}
        onChange={handleChange}
        invalid={Boolean(getFieldError(errors, 'menu_path'))}
        feedbackInvalid={getFieldError(errors, 'menu_path')}
        disabled={saving}
        className="mb-3"
      />

      <CFormInput
        label="Icon"
        name="menu_icon"
        value={form.menu_icon}
        onChange={handleChange}
        invalid={Boolean(getFieldError(errors, 'menu_icon'))}
        feedbackInvalid={getFieldError(errors, 'menu_icon')}
        disabled={saving}
        className="mb-3"
      />

      <div className="mb-3">
        <label className="form-label">Parent Menu</label>
        <Select
          classNamePrefix="react-select"
          className="react-select-container"
          options={parentOptions}
          value={
            form.menu_parent_id ? parentOptions.find((o) => o.value === form.menu_parent_id) : null
          }
          onChange={handleParentChange}
          isClearable
          isDisabled={saving}
        />
        {getFieldError(errors, 'menu_parent_id') && (
          <div className="invalid-feedback d-block">{getFieldError(errors, 'menu_parent_id')}</div>
        )}
      </div>

      <CFormInput
        label="Order"
        name="menu_order"
        type="number"
        value={form.menu_order}
        onChange={handleChange}
        invalid={Boolean(getFieldError(errors, 'menu_order'))}
        feedbackInvalid={getFieldError(errors, 'menu_order')}
        disabled={saving}
        className="mb-3"
      />

      <CButton color="primary" className="me-2" type="submit" disabled={saving}>
        {saving ? (
          <>
            <CSpinner size="sm" className="me-2" />
            {menu ? 'Updating...' : 'Creating...'}
          </>
        ) : menu ? (
          'Update Menu'
        ) : (
          'Create Menu'
        )}
      </CButton>

      <CButton color="secondary" type="button" onClick={onReset} disabled={saving}>
        Reset
      </CButton>
    </CForm>
  )
}

export default MenusForm
