import React, { useState, useEffect, useRef } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CForm,
  CFormInput,
  CButton,
  CSpinner,
  CAvatar,
  CBadge,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUser, cilLockLocked, cilCamera, cilTrash } from '@coreui/icons'
import { useSelector, useDispatch } from 'react-redux'
import api from '../../services/api'
import { toastSuccess } from '../../services/toastService'
import { getFieldError } from '../../utils/formErrors'
import avatar8 from '../../assets/images/avatars/8.jpg'
import AvatarCropModal from './AvatarCropModal'

const Profile = () => {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.user)
  const fileInputRef = useRef(null)

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    avatar: null,
  })
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [isAvatarDirty, setIsAvatarDirty] = useState(false)
  const [fileError, setFileError] = useState(null)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileErrors, setProfileErrors] = useState({})

  // Cropper Modal state
  const [cropModalVisible, setCropModalVisible] = useState(false)
  const [selectedRawImage, setSelectedRawImage] = useState(null)

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState({})

  // Initialize form from redux user state
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || null,
      })
      setAvatarPreview(user.avatar || null)
      setIsAvatarDirty(false)
    }
  }, [user])

  /* ===============================
     AVATAR FILE HANDLERS
  ============================== */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setFileError('File yang dipilih harus berupa gambar (JPG, PNG, WebP).')
      e.target.value = ''
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileError('Ukuran file maksimal 10MB.')
      e.target.value = ''
      return
    }

    setFileError(null)
    const reader = new FileReader()
    reader.onload = () => {
      setSelectedRawImage(reader.result)
      setCropModalVisible(true)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleCropApply = (croppedCircleDataUrl) => {
    setProfileForm((prev) => ({ ...prev, avatar: croppedCircleDataUrl }))
    setAvatarPreview(croppedCircleDataUrl)
    setIsAvatarDirty(true)
    setFileError(null)
  }

  const handleRemoveAvatar = () => {
    setProfileForm((prev) => ({ ...prev, avatar: '' }))
    setAvatarPreview(null)
    setIsAvatarDirty(true)
    setFileError(null)
  }

  /* ===============================
     SUBMIT PROFILE
  ============================== */
  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileSaving(true)
    setProfileErrors({})
    setFileError(null)

    try {
      const payload = {
        name: profileForm.name,
        email: profileForm.email,
        avatar: profileForm.avatar,
      }

      const res = await api.put('/profile', payload)

      // Update Redux state with updated user
      dispatch({
        type: 'set',
        user: res.data.data,
      })

      setIsAvatarDirty(false)
      toastSuccess('Profil dan foto berhasil diperbarui')
    } catch (err) {
      setProfileErrors(err.validationErrors || {})
    } finally {
      setProfileSaving(false)
    }
  }

  /* ===============================
     SUBMIT PASSWORD
  ============================== */
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = {}

    if (!currentPassword) nextErrors.current_password = ['Password saat ini wajib diisi.']
    if (!newPassword) nextErrors.new_password = ['Password baru wajib diisi.']
    if (!confirmPassword) nextErrors.confirm_password = ['Konfirmasi password wajib diisi.']

    if (newPassword && newPassword.length < 6) {
      nextErrors.new_password = ['Password baru minimal 6 karakter.']
    }

    if (newPassword !== confirmPassword) {
      nextErrors.confirm_password = ['Konfirmasi password tidak cocok.']
    }

    if (Object.keys(nextErrors).length) {
      setPasswordErrors(nextErrors)
      return
    }

    setPasswordLoading(true)
    setPasswordErrors({})

    try {
      await api.post('/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      })

      toastSuccess('Password berhasil diubah. Silakan login kembali.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      setTimeout(() => {
        localStorage.removeItem('token')
        window.location.href = '/#/login'
      }, 1500)
    } catch (err) {
      setPasswordErrors(err.validationErrors || {})
    } finally {
      setPasswordLoading(false)
    }
  }

  const roleName = user?.role?.name || (user?.role_id === 1 ? 'Super Admin' : 'User')
  const createdAtFormatted = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-'

  return (
    <div>
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/png,image/jpeg,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Circular Crop Modal */}
      <AvatarCropModal
        visible={cropModalVisible}
        imageSrc={selectedRawImage}
        onClose={() => setCropModalVisible(false)}
        onApply={handleCropApply}
      />

      {/* Profil Header Card */}
      <CCard className="mb-4">
        <CCardBody className="p-4">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-4">
            <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-3">
              <div className="position-relative">
                <CAvatar
                  src={avatarPreview || avatar8}
                  size="xl"
                  className="border border-2 border-primary shadow-sm"
                  style={{
                    width: '80px',
                    height: '80px',
                    cursor: 'pointer',
                    objectFit: 'cover',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  title="Klik untuk memilih foto baru"
                />
              </div>

              <div>
                <div className="d-flex align-items-center gap-2">
                  <h4 className="mb-0 fw-bold">{user?.name || 'Nama Pengguna'}</h4>
                  <CBadge color="primary" className="text-uppercase">
                    {roleName}
                  </CBadge>
                </div>
                <div className="text-body-secondary mt-1">{user?.email || 'email@example.com'}</div>
                <div className="text-body-secondary small mt-1">
                  Terdaftar sejak {createdAtFormatted}
                  {isAvatarDirty && (
                    <CBadge color="warning" className="ms-2">
                      Belum disimpan
                    </CBadge>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons for Avatar */}
            <div className="d-flex align-items-center gap-2">
              <CButton
                color="primary"
                variant="outline"
                size="sm"
                className="d-flex align-items-center gap-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={profileSaving}
              >
                <CIcon icon={cilCamera} size="sm" />
                <span>Ganti Foto</span>
              </CButton>

              {avatarPreview && (
                <CButton
                  color="danger"
                  variant="outline"
                  size="sm"
                  className="d-flex align-items-center gap-1"
                  onClick={handleRemoveAvatar}
                  disabled={profileSaving}
                  title="Hapus foto profil"
                >
                  <CIcon icon={cilTrash} size="sm" />
                  <span>Hapus Foto</span>
                </CButton>
              )}
            </div>
          </div>

          {fileError && (
            <CAlert color="danger" className="mt-3 mb-0 py-2 small" dismissible onClose={() => setFileError(null)}>
              {fileError}
            </CAlert>
          )}
        </CCardBody>
      </CCard>

      <CRow>
        {/* Kolom Kiri: Informasi Pribadi */}
        <CCol lg={6} className="mb-4">
          <CCard className="h-100">
            <CCardHeader className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <CIcon icon={cilUser} className="me-2 text-primary" />
                <strong>Informasi Pribadi</strong>
              </div>
              {isAvatarDirty && (
                <CBadge color="warning" className="small">
                  Ada perubahan belum disimpan
                </CBadge>
              )}
            </CCardHeader>
            <CCardBody>
              <CForm onSubmit={handleProfileSubmit}>
                <CFormInput
                  label="Nama Lengkap"
                  value={profileForm.name}
                  onChange={(e) => {
                    setProfileErrors({ ...profileErrors, name: null })
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }}
                  invalid={Boolean(getFieldError(profileErrors, 'name'))}
                  feedbackInvalid={getFieldError(profileErrors, 'name')}
                  disabled={profileSaving}
                  className="mb-3"
                  required
                />

                <CFormInput
                  type="email"
                  label="Alamat Email"
                  value={profileForm.email}
                  onChange={(e) => {
                    setProfileErrors({ ...profileErrors, email: null })
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }}
                  invalid={Boolean(getFieldError(profileErrors, 'email'))}
                  feedbackInvalid={getFieldError(profileErrors, 'email')}
                  disabled={profileSaving}
                  className="mb-3"
                  required
                />

                <CFormInput
                  label="Peran (Role)"
                  value={roleName}
                  disabled
                  readOnly
                  className="mb-3 bg-body-tertiary"
                />

                <div className="p-3 bg-body-tertiary rounded mb-4">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <div className="fw-semibold small">Foto Profil</div>
                      <div className="text-body-secondary small">
                        Format JPG, PNG, atau WebP (maks. 10MB)
                      </div>
                    </div>
                    <CButton
                      type="button"
                      color="secondary"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={profileSaving}
                      className="d-flex align-items-center gap-1"
                    >
                      <CIcon icon={cilCamera} size="sm" />
                      Pilih Foto
                    </CButton>
                  </div>
                </div>

                <div className="d-flex justify-content-end">
                  <CButton type="submit" color="primary" disabled={profileSaving}>
                    {profileSaving ? (
                      <>
                        <CSpinner size="sm" className="me-2" />
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan Perubahan'
                    )}
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>

        {/* Kolom Kanan: Keamanan & Ubah Password */}
        <CCol lg={6} className="mb-4">
          <CCard className="h-100">
            <CCardHeader className="d-flex align-items-center">
              <CIcon icon={cilLockLocked} className="me-2 text-warning" />
              <strong>Keamanan &amp; Kata Sandi</strong>
            </CCardHeader>
            <CCardBody>
              <CForm onSubmit={handlePasswordSubmit}>
                <CFormInput
                  type="password"
                  label="Kata Sandi Saat Ini"
                  value={currentPassword}
                  onChange={(e) => {
                    setPasswordErrors({ ...passwordErrors, current_password: null })
                    setCurrentPassword(e.target.value)
                  }}
                  invalid={Boolean(getFieldError(passwordErrors, 'current_password'))}
                  feedbackInvalid={getFieldError(passwordErrors, 'current_password')}
                  disabled={passwordLoading}
                  className="mb-3"
                  placeholder="Masukkan kata sandi saat ini"
                />

                <CFormInput
                  type="password"
                  label="Kata Sandi Baru"
                  value={newPassword}
                  onChange={(e) => {
                    setPasswordErrors({ ...passwordErrors, new_password: null })
                    setNewPassword(e.target.value)
                  }}
                  invalid={Boolean(getFieldError(passwordErrors, 'new_password'))}
                  feedbackInvalid={getFieldError(passwordErrors, 'new_password')}
                  disabled={passwordLoading}
                  className="mb-3"
                  placeholder="Minimal 6 karakter"
                />

                <CFormInput
                  type="password"
                  label="Konfirmasi Kata Sandi Baru"
                  value={confirmPassword}
                  onChange={(e) => {
                    setPasswordErrors({ ...passwordErrors, confirm_password: null })
                    setConfirmPassword(e.target.value)
                  }}
                  invalid={Boolean(getFieldError(passwordErrors, 'confirm_password'))}
                  feedbackInvalid={getFieldError(passwordErrors, 'confirm_password')}
                  disabled={passwordLoading}
                  className="mb-4"
                  placeholder="Ulangi kata sandi baru"
                />

                <div className="d-flex justify-content-end">
                  <CButton type="submit" color="warning" disabled={passwordLoading}>
                    {passwordLoading ? (
                      <>
                        <CSpinner size="sm" className="me-2" />
                        Memproses...
                      </>
                    ) : (
                      'Ubah Kata Sandi'
                    )}
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  )
}

export default Profile