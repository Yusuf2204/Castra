import React, { useState } from 'react'
import { CCard, CCardBody, CCardHeader, CForm, CFormInput, CButton, CSpinner } from '@coreui/react'
import { useSelector } from 'react-redux'
import api from '../../../services/api'
import { toastSuccess } from '../../../services/toastService'
import { getFieldError } from '../../../utils/formErrors'

const Changepassword = () => {
  const user = useSelector((state) => state.user)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = {}

    if (!currentPassword) nextErrors.current_password = ['Current password is required.']
    if (!newPassword) nextErrors.new_password = ['New password is required.']
    if (!confirmPassword) nextErrors.confirm_password = ['Password confirmation is required.']

    if (newPassword && newPassword.length < 6) {
      nextErrors.new_password = ['New password must be at least 6 characters.']
    }

    if (newPassword !== confirmPassword) {
      nextErrors.confirm_password = ['Password confirmation does not match.']
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      await api.post('/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      })

      toastSuccess('Password changed. Please login again.')

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      // auto logout after 1.5s
      setTimeout(() => {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }, 1500)
    } catch (err) {
      setErrors(err.validationErrors || {})
    } finally {
      setLoading(false)
    }
  }

  return (
    <CCard>
      <CCardHeader>Change Password</CCardHeader>
      <CCardBody>
        <CForm onSubmit={handleSubmit}>
          <CFormInput label="Email" value={user?.email || ''} readOnly className="mb-3" />

          <CFormInput
            type="password"
            label="Current Password"
            value={currentPassword}
            onChange={(e) => {
              setErrors({ ...errors, current_password: null })
              setCurrentPassword(e.target.value)
            }}
            invalid={Boolean(getFieldError(errors, 'current_password'))}
            feedbackInvalid={getFieldError(errors, 'current_password')}
            disabled={loading}
            className="mb-3"
          />

          <CFormInput
            type="password"
            label="New Password"
            value={newPassword}
            onChange={(e) => {
              setErrors({ ...errors, new_password: null })
              setNewPassword(e.target.value)
            }}
            invalid={Boolean(getFieldError(errors, 'new_password'))}
            feedbackInvalid={getFieldError(errors, 'new_password')}
            disabled={loading}
            className="mb-3"
          />

          <CFormInput
            type="password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => {
              setErrors({ ...errors, confirm_password: null })
              setConfirmPassword(e.target.value)
            }}
            invalid={Boolean(getFieldError(errors, 'confirm_password'))}
            feedbackInvalid={getFieldError(errors, 'confirm_password')}
            disabled={loading}
            className="mb-4"
          />

          <CButton type="submit" color="primary" disabled={loading}>
            {loading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              'Save Password'
            )}
          </CButton>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default Changepassword
