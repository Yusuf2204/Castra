import React, { useEffect, useState } from 'react'
import { CForm, CFormInput, CButton, CSpinner } from '@coreui/react'
import api from '../../../services/api'
import { toastSuccess } from '../../../services/toastService'
import { getFieldError } from '../../../utils/formErrors'

const RolesForm = ({ role, onReset, onSaved }) => {
  const [roleName, setRoleName] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (role) {
      setRoleName(role.role_name)
    } else {
      setRoleName('')
    }
  }, [role])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})

    try {
      if (role) {
        await api.put(`/roles/${role.id}`, {
          role_name: roleName,
        })
        toastSuccess('Role updated')
      } else {
        await api.post('/roles', {
          role_name: roleName,
        })
        toastSuccess('Role created')
      }

      setRoleName('')
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
        label="Role Name"
        value={roleName}
        onChange={(e) => {
          setErrors({ ...errors, role_name: null })
          setRoleName(e.target.value)
        }}
        invalid={Boolean(getFieldError(errors, 'role_name'))}
        feedbackInvalid={getFieldError(errors, 'role_name')}
        disabled={saving}
        className="mb-3"
      />

      <CButton type="submit" color="primary" disabled={saving}>
        {saving ? (
          <>
            <CSpinner size="sm" className="me-2" />
            {role ? 'Updating...' : 'Creating...'}
          </>
        ) : role ? (
          'Update Role'
        ) : (
          'Create Role'
        )}
      </CButton>

      <CButton type="button" color="secondary" onClick={onReset} className="ms-2" disabled={saving}>
        Reset
      </CButton>
    </CForm>
  )
}

export default RolesForm
