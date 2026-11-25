import React, { useState, useEffect } from 'react'
import api from '../../../services/api'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import {
  CButton,
  CCard,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CSpinner,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilLockLocked,
  cilLockUnlocked,
  cilUser,
  cilWallet,
  cilShieldAlt,
  cilCheckCircle,
} from '@coreui/icons'
import { getFieldError } from '../../../utils/formErrors'
import castraLogoWhite from '../../../assets/images/logos/castra_logo_white.svg'

const Register = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    const token = localStorage.getItem('token')
    if (token) {
      navigate('/dashboard')
    }
  }, [navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setErrors((prev) => ({ ...prev, [name]: null, general: null }))
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const res = await api.post('/register', form)

      // Store sanctum token
      localStorage.setItem('token', res.data.data.token)

      // Store Redux session state
      dispatch({
        type: 'set',
        user: res.data.data.user,
        company: res.data.data.company,
        navigation: res.data.data.navigation || [],
      })

      // Redirect immediately to dashboard
      navigate('/dashboard')
    } catch (err) {
      const validationErrors = err.validationErrors || {}
      setErrors(
        Object.keys(validationErrors).length
          ? validationErrors
          : {
              general: [err.userMessage || 'Gagal melakukan pendaftaran. Silakan coba kembali.'],
            },
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page-wrapper min-vh-100 d-flex flex-row align-items-center py-4 py-md-5">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol xl={10} lg={11} md={12}>
            <CCard className="border-0 shadow-lg overflow-hidden rounded-4">
              <CRow className="g-0">
                {/* Panel Kiri: Showcase & Branding */}
                <CCol
                  md={5}
                  className="login-showcase-panel text-white p-4 p-lg-5 d-flex flex-column justify-content-between position-relative"
                >
                  <div>
                    {/* Brand Header */}
                    <div className="mb-4">
                      <img
                        src={castraLogoWhite}
                        alt="Castra"
                        height="44"
                        className="mb-2"
                        style={{ objectFit: 'contain' }}
                      />
                      <div className="d-block">
                        <span className="badge bg-white bg-opacity-25 text-white px-3 py-1 small rounded-pill">
                          Registrasi Akun Baru
                        </span>
                      </div>
                    </div>

                    {/* Headline */}
                    <h3 className="fw-bold mb-3 lh-sm text-white">
                      Mulai Kelola Finansial Kantor Anda Sekarang.
                    </h3>
                    <p className="text-white-50 small mb-4">
                      Satu akun untuk mencatat kas kecil, menyusun siklus pagu belanja, dan mengarsipkan bukti fisik transaksi secara rapi.
                    </p>

                    {/* Benefit Points */}
                    <div className="d-none d-md-flex flex-column gap-3 mb-4">
                      <div className="d-flex align-items-start">
                        <CIcon icon={cilUser} size="xl" className="text-white me-3 flex-shrink-0 mt-1" />
                        <div>
                          <div className="fw-semibold small text-white">Profil Pengguna Mandiri</div>
                          <div className="text-white-50" style={{ fontSize: '0.78rem' }}>
                            Data transaksi dan riwayat mutasi kas Anda tersimpan aman dan terpisah.
                          </div>
                        </div>
                      </div>

                      <div className="d-flex align-items-start">
                        <CIcon icon={cilWallet} size="xl" className="text-white me-3 flex-shrink-0 mt-1" />
                        <div>
                          <div className="fw-semibold small text-white">Template Kas Siap Pakai</div>
                          <div className="text-white-50" style={{ fontSize: '0.78rem' }}>
                            Otomatis disiapkan akun kas kecil, kas utama, dan kategori anggaran standar.
                          </div>
                        </div>
                      </div>

                      <div className="d-flex align-items-start">
                        <CIcon icon={cilCheckCircle} size="xl" className="text-white me-3 flex-shrink-0 mt-1" />
                        <div>
                          <div className="fw-semibold small text-white">Akses Penuh Fitur</div>
                          <div className="text-white-50" style={{ fontSize: '0.78rem' }}>
                            Termasuk kalender transaksi, buku kas kecil, voucher cetak, dan laporan arus kas.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Panel Footer Security Note */}
                  <div className="d-flex align-items-center gap-2 pt-3 border-top border-white border-opacity-25 text-white-50 small">
                    <CIcon icon={cilShieldAlt} size="sm" className="text-white" />
                    <span style={{ fontSize: '0.75rem' }}>Data Finansial Terenkripsi & Terlindungi</span>
                  </div>
                </CCol>

                {/* Panel Kanan: Form Registrasi */}
                <CCol md={7} className="p-4 p-sm-5 bg-body d-flex flex-column justify-content-center">
                  <div className="px-lg-3">
                    <div className="mb-4">
                      <h2 className="fw-bold mb-1">Daftar Akun Baru ✨</h2>
                      <p className="text-body-secondary small">
                        Lengkapi formulir di bawah ini untuk membuat akun pengguna Anda.
                      </p>
                    </div>

                    {errors.general && (
                      <CAlert color="danger" className="py-2 small d-flex align-items-center gap-2 mb-4">
                        <span>{Array.isArray(errors.general) ? errors.general[0] : errors.general}</span>
                      </CAlert>
                    )}

                    <CForm onSubmit={handleRegister}>
                      {/* Nama Lengkap */}
                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-body-secondary">
                          Nama Lengkap / Username *
                        </label>
                        <CInputGroup>
                          <CInputGroupText className="bg-body-secondary border-end-0 text-secondary">
                            <CIcon icon={cilUser} />
                          </CInputGroupText>
                          <CFormInput
                            type="text"
                            name="name"
                            placeholder="Masukkan nama lengkap Anda"
                            autoComplete="name"
                            value={form.name}
                            onChange={handleChange}
                            invalid={Boolean(getFieldError(errors, 'name'))}
                            feedbackInvalid={getFieldError(errors, 'name')}
                            disabled={loading}
                            className="py-2"
                            required
                          />
                        </CInputGroup>
                      </div>

                      {/* Alamat Email */}
                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-body-secondary">
                          Alamat Email *
                        </label>
                        <CInputGroup>
                          <CInputGroupText className="bg-body-secondary border-end-0 text-secondary">
                            @
                          </CInputGroupText>
                          <CFormInput
                            type="email"
                            name="email"
                            placeholder="nama@perusahaan.com"
                            autoComplete="email"
                            value={form.email}
                            onChange={handleChange}
                            invalid={Boolean(getFieldError(errors, 'email'))}
                            feedbackInvalid={getFieldError(errors, 'email')}
                            disabled={loading}
                            className="py-2"
                            required
                          />
                        </CInputGroup>
                      </div>

                      {/* Password */}
                      {(() => {
                        const passwordError = getFieldError(errors, 'password')
                        return (
                          <div className="mb-3">
                            <label className="form-label small fw-semibold text-body-secondary">
                              Password *
                            </label>
                            <CInputGroup className={passwordError ? 'has-validation' : ''}>
                              <CInputGroupText className={`bg-body-secondary border-end-0 ${passwordError ? 'border-danger text-danger' : 'text-secondary'}`}>
                                <CIcon icon={showPassword ? cilLockUnlocked : cilLockLocked} />
                              </CInputGroupText>
                              <CFormInput
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                placeholder="Minimal 6 karakter"
                                autoComplete="new-password"
                                value={form.password}
                                onChange={handleChange}
                                invalid={Boolean(passwordError)}
                                disabled={loading}
                                className="py-2 border-end-0"
                                style={{ backgroundImage: 'none' }}
                                required
                              />
                              <CButton
                                type="button"
                                color={passwordError ? 'danger' : 'secondary'}
                                variant="outline"
                                className={`border-start-0 d-flex align-items-center ${passwordError ? 'border-danger text-danger' : 'text-secondary'}`}
                                onClick={() => setShowPassword(!showPassword)}
                                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                              >
                                <CIcon icon={showPassword ? cilLockUnlocked : cilLockLocked} />
                              </CButton>
                            </CInputGroup>
                            {passwordError && (
                              <div className="text-danger small mt-1">
                                {passwordError}
                              </div>
                            )}
                          </div>
                        )
                      })()}

                      {/* Konfirmasi Password */}
                      {(() => {
                        const confirmPasswordError = getFieldError(errors, 'password_confirmation')
                        return (
                          <div className="mb-4">
                            <label className="form-label small fw-semibold text-body-secondary">
                              Konfirmasi Password *
                            </label>
                            <CInputGroup className={confirmPasswordError ? 'has-validation' : ''}>
                              <CInputGroupText className={`bg-body-secondary border-end-0 ${confirmPasswordError ? 'border-danger text-danger' : 'text-secondary'}`}>
                                <CIcon icon={showConfirmPassword ? cilLockUnlocked : cilLockLocked} />
                              </CInputGroupText>
                              <CFormInput
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="password_confirmation"
                                placeholder="Ulangi password Anda"
                                autoComplete="new-password"
                                value={form.password_confirmation}
                                onChange={handleChange}
                                invalid={Boolean(confirmPasswordError)}
                                disabled={loading}
                                className="py-2 border-end-0"
                                style={{ backgroundImage: 'none' }}
                                required
                              />
                              <CButton
                                type="button"
                                color={confirmPasswordError ? 'danger' : 'secondary'}
                                variant="outline"
                                className={`border-start-0 d-flex align-items-center ${confirmPasswordError ? 'border-danger text-danger' : 'text-secondary'}`}
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                title={showConfirmPassword ? 'Sembunyikan password' : 'Lihat password'}
                              >
                                <CIcon icon={showConfirmPassword ? cilLockUnlocked : cilLockLocked} />
                              </CButton>
                            </CInputGroup>
                            {confirmPasswordError && (
                              <div className="text-danger small mt-1">
                                {confirmPasswordError}
                              </div>
                            )}
                          </div>
                        )
                      })()}

                      <CButton
                        type="submit"
                        color="primary"
                        className="w-100 py-2 fs-6 fw-semibold shadow-sm mb-3"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <CSpinner size="sm" className="me-2" />
                            Membuat Akun & Menyiapkan Data...
                          </>
                        ) : (
                          'Daftar & Masuk ke Dashboard'
                        )}
                      </CButton>

                      <div className="text-center text-body-secondary small mt-3">
                        Sudah memiliki akun?{' '}
                        <Link to="/login" className="text-primary fw-semibold text-decoration-none">
                          Masuk di sini
                        </Link>
                      </div>
                    </CForm>
                  </div>
                </CCol>
              </CRow>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Register
