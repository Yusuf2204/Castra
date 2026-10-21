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

    if (!currentPassword) nextErrors.current_password = ['Kata sandi saat ini wajib diisi.']
    if (!newPassword) nextErrors.new_password = ['Kata sandi baru wajib diisi.']
    if (!confirmPassword) nextErrors.confirm_password = ['Konfirmasi kata sandi wajib diisi.']

    if (newPassword && newPassword.length < 6) {
      nextErrors.new_password = ['Kata sandi baru minimal 6 karakter.']
    }

    if (newPassword !== confirmPassword) {
      nextErrors.confirm_password = ['Konfirmasi kata sandi tidak cocok.']
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

      toastSuccess('Kata sandi berhasil diubah. Silakan login kembali.')

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      // auto logout after 1.5s
      setTimeout(() => {
        localStorage.removeItem('token')
        window.location.href = '/#/login'
      }, 1500)
    } catch (err) {
      setErrors(err.validationErrors || {})
    } finally {
      setLoading(false)
    }
  }

  return (
    <CCard>
      <CCardHeader>Ubah Kata Sandi</CCardHeader>
      <CCardBody>
        <CForm onSubmit={handleSubmit}>
          <CFormInput label="Email" value={user?.email || ''} readOnly className="mb-3" />

          <CFormInput
            type="password"
            label="Kata Sandi Saat Ini"
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
            label="Kata Sandi Baru"
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
            label="Konfirmasi Kata Sandi Baru"
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
                Menyimpan...
              </>
            ) : (
              'Simpan Kata Sandi'
            )}
          </CButton>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default Changepassword
