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
  cilCalendar,
  cilBolt,
  cilShieldAlt,
} from '@coreui/icons'
import { getFieldError } from '../../../utils/formErrors'
import castraLogoWhite from '../../../assets/images/logos/castra_logo_white.svg'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (!token) return

      try {
        const res = await api.get('/me')
        dispatch({
          type: 'set',
          user: res.data.data.user,
          company: res.data.data.company,
          navigation: res.data.data.navigation || [],
        })
        navigate('/dashboard')
      } catch {
        localStorage.removeItem('token')
      }
    }

    checkAuth()
  }, [dispatch, navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const res = await api.post('/login', { email, password })

      localStorage.setItem('token', res.data.data.token)
      dispatch({
        type: 'set',
        user: res.data.data.user,
        company: res.data.data.company,
        navigation: res.data.data.navigation || [],
      })

      navigate('/dashboard')
    } catch (err) {
      const validationErrors = err.validationErrors || {}
      setErrors(
        Object.keys(validationErrors).length
          ? validationErrors
          : {
              auth: [err.userMessage || 'Email atau password yang Anda masukkan salah.'],
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
                {/* Panel Kiri: Showcase & Branding (Gradient Modern) */}
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
                          Sistem Keuangan & Kas Kantor
                        </span>
                      </div>
                    </div>

                    {/* Headline */}
                    <h3 className="fw-bold mb-3 lh-sm text-white">
                      Kelola Kas & Anggaran Lebih Akurat dan Transparan.
                    </h3>
                    <p className="text-white-50 small mb-4">
                      Platform terintegrasi untuk pencatatan kas operasional, siklus anggaran gajian, dan otomasi bukti nota fisik.
                    </p>

                    {/* Feature Highlights with CoreUI Icons */}
                    <div className="d-none d-md-flex flex-column gap-3 mb-4">
                      <div className="d-flex align-items-start">
                        <CIcon icon={cilWallet} size="xl" className="text-white me-3 flex-shrink-0 mt-1" />
                        <div>
                          <div className="fw-semibold small text-white">Buku Kas Kecil (Imprest Fund)</div>
                          <div className="text-white-50" style={{ fontSize: '0.78rem' }}>
                            Pencatatan kas operasional dengan plafon saldo dan mutasi real-time.
                          </div>
                        </div>
                      </div>

                      <div className="d-flex align-items-start">
                        <CIcon icon={cilCalendar} size="xl" className="text-white me-3 flex-shrink-0 mt-1" />
                        <div>
                          <div className="fw-semibold small text-white">Anggaran Berbasis Siklus Gajian</div>
                          <div className="text-white-50" style={{ fontSize: '0.78rem' }}>
                            Alokasi pagu belanja fleksibel mengikuti pergeseran tanggal gajian.
                          </div>
                        </div>
                      </div>

                      <div className="d-flex align-items-start">
                        <CIcon icon={cilBolt} size="xl" className="text-white me-3 flex-shrink-0 mt-1" />
                        <div>
                          <div className="fw-semibold small text-white">Pindai Otomatis Nota dengan AI OCR</div>
                          <div className="text-white-50" style={{ fontSize: '0.78rem' }}>
                            Ekstraksi nominal dan deteksi nota belanja langsung dari struk fisik.
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

                {/* Panel Kanan: Form Login */}
                <CCol md={7} className="p-4 p-sm-5 bg-body d-flex flex-column justify-content-center">
                  <div className="px-lg-3">
                    <div className="mb-4">
                      <h2 className="fw-bold mb-1">Selamat Datang 👋</h2>
                      <p className="text-body-secondary small">
                        Silakan masukkan kredensial akun Anda untuk masuk ke sistem.
                      </p>
                    </div>

                    {errors.auth && (
                      <CAlert color="danger" className="py-2 small d-flex align-items-center gap-2 mb-4">
                        <span>{Array.isArray(errors.auth) ? errors.auth[0] : errors.auth}</span>
                      </CAlert>
                    )}

                    <CForm onSubmit={handleLogin}>
                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-body-secondary">
                          Alamat Email
                        </label>
                        <CInputGroup>
                          <CInputGroupText className="bg-body-secondary border-end-0 text-secondary">
                            <CIcon icon={cilUser} />
                          </CInputGroupText>
                          <CFormInput
                            type="email"
                            placeholder="nama@perusahaan.com"
                            autoComplete="username"
                            value={email}
                            onChange={(e) => {
                              setErrors({ ...errors, email: null, auth: null })
                              setEmail(e.target.value)
                            }}
                            invalid={Boolean(getFieldError(errors, 'email'))}
                            feedbackInvalid={getFieldError(errors, 'email')}
                            disabled={loading}
                            className="py-2"
                            required
                          />
                        </CInputGroup>
                      </div>

                      <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <label className="form-label small fw-semibold text-body-secondary mb-0">
                            Password
                          </label>
                        </div>
                        <CInputGroup>
                          <CInputGroupText className="bg-body-secondary border-end-0 text-secondary">
                            <CIcon icon={showPassword ? cilLockUnlocked : cilLockLocked} />
                          </CInputGroupText>
                          <CFormInput
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Masukkan password Anda"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => {
                              setErrors({ ...errors, password: null, auth: null })
                              setPassword(e.target.value)
                            }}
                            invalid={Boolean(
                              getFieldError(errors, 'password') || getFieldError(errors, 'auth'),
                            )}
                            feedbackInvalid={
                              getFieldError(errors, 'password') || getFieldError(errors, 'auth')
                            }
                            disabled={loading}
                            className="py-2 border-end-0"
                            required
                          />
                          <CButton
                            type="button"
                            color="secondary"
                            variant="outline"
                            className="border-start-0 text-secondary d-flex align-items-center"
                            onClick={() => setShowPassword(!showPassword)}
                            title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                          >
                            <CIcon icon={showPassword ? cilLockUnlocked : cilLockLocked} />
                          </CButton>
                        </CInputGroup>
                      </div>

                      <CButton
                        type="submit"
                        color="primary"
                        className="w-100 py-2 fs-6 fw-semibold shadow-sm mb-3"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <CSpinner size="sm" className="me-2" />
                            Memverifikasi Akun...
                          </>
                        ) : (
                          'Masuk ke Sistem'
                        )}
                      </CButton>

                      <div className="text-center text-body-secondary small mt-3">
                        Belum memiliki akun?{' '}
                        <Link to="/register" className="text-primary fw-semibold text-decoration-none">
                          Daftar Akun Baru
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

export default Login
