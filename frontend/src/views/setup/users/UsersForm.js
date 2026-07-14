import React, { useEffect, useState } from 'react'
import { CForm, CFormInput, CButton, CSpinner } from '@coreui/react'
import Select from 'react-select'
import api from '../../../services/api'
import { toastSuccess } from '../../../services/toastService'
import { getFieldError } from '../../../utils/formErrors'

const UsersForm = ({ user, onReset, onSaved }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role_id: null,
  })

  const [roles, setRoles] = useState([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const fetchRoles = async () => {
    const res = await api.get('/roles')

    const options = res.data.data.map((r) => ({
      value: r.id,
      label: r.role_name,
    }))

    setRoles(options)
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        email: user.email,
        password: '',
        role_id: user.role_id || null,
      })
    } else {
      setForm({
        name: '',
        email: '',
        password: '',
        role_id: null,
      })
    }
  }, [user])

  const handleChange = (e) => {
    setErrors({ ...errors, [e.target.name]: null })
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleRoleChange = (selected) => {
    setErrors({ ...errors, role_id: null })
    setForm({ ...form, role_id: selected ? selected.value : null })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})

    const payload = { ...form }
    if (user && !payload.password) delete payload.password

    try {
      if (user) {
        await api.put(`/users/${user.id}`, payload)
        toastSuccess('User updated')
      } else {
        await api.post('/users', payload)
        toastSuccess('User created')
      }

      setForm({
        name: '',
        email: '',
        password: '',
        role_id: null,
      })

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
        label="Name"
        name="name"
        value={form.name}
        onChange={handleChange}
        invalid={Boolean(getFieldError(errors, 'name'))}
        feedbackInvalid={getFieldError(errors, 'name')}
        disabled={saving}
        className="mb-3"
      />

      <CFormInput
        label="Email"
        name="email"
        value={form.email}
        onChange={handleChange}
        invalid={Boolean(getFieldError(errors, 'email'))}
        feedbackInvalid={getFieldError(errors, 'email')}
        disabled={saving}
        className="mb-3"
      />

      <CFormInput
        type="password"
        label={user ? 'New Password (optional)' : 'Password'}
        name="password"
        value={form.password}
        onChange={handleChange}
        invalid={Boolean(getFieldError(errors, 'password'))}
        feedbackInvalid={getFieldError(errors, 'password')}
        disabled={saving}
        className="mb-3"
      />

      <div className="mb-4">
        <label className="form-label">Role</label>
        <Select
          classNamePrefix="react-select"
          className="react-select-container"
          options={roles}
          placeholder="Select role..."
          value={form.role_id ? roles.find((r) => r.value === form.role_id) : null}
          onChange={handleRoleChange}
          isClearable
          isDisabled={saving}
        />
        {getFieldError(errors, 'role_id') && (
          <div className="invalid-feedback d-block">{getFieldError(errors, 'role_id')}</div>
        )}
      </div>

      <CButton type="submit" color="primary" disabled={saving}>
        {saving ? (
          <>
            <CSpinner size="sm" className="me-2" />
            {user ? 'Updating...' : 'Creating...'}
          </>
        ) : user ? (
          'Update User'
        ) : (
          'Create User'
        )}
      </CButton>

      <CButton type="button" color="secondary" onClick={onReset} className="ms-2" disabled={saving}>
        Reset
      </CButton>
    </CForm>
  )
}

export default UsersForm
