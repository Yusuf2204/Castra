import React, { useState, useEffect } from 'react'
import api from '../../../services/api'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import { getFieldError } from '../../../utils/formErrors'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
              auth: [err.userMessage || 'Invalid email or password'],
            },
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8}>
            <CCardGroup>
              <CCard className="p-4">
                <CCardBody>
                  <CForm onSubmit={handleLogin}>
                    <h1>Login</h1>
                    <p className="text-body-secondary">Sign In to your account</p>

                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        placeholder="Email"
                        autoComplete="username"
                        value={email}
                        onChange={(e) => {
                          setErrors({ ...errors, email: null, auth: null })
                          setEmail(e.target.value)
                        }}
                        invalid={Boolean(getFieldError(errors, 'email'))}
                        feedbackInvalid={getFieldError(errors, 'email')}
                        disabled={loading}
                      />
                    </CInputGroup>

                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="password"
                        placeholder="Password"
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
                      />
                    </CInputGroup>

                    <CRow>
                      <CCol xs={6}>
                        <CButton type="submit" color="primary" className="px-4" disabled={loading}>
                          {loading ? (
                            <>
                              <CSpinner size="sm" className="me-2" />
                              Signing in...
                            </>
                          ) : (
                            'Login'
                          )}
                        </CButton>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>

              <CCard className="text-white bg-primary py-5" style={{ width: '44%' }}>
                <CCardBody className="text-center">
                  <h2>Sign up</h2>
                  <p>Create new account</p>
                  <Link to="/register">
                    <CButton color="light" className="mt-3">
                      Register Now!
                    </CButton>
                  </Link>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Login
