import axios from 'axios'
import { toastError } from './toastService'
import { normalizeValidationErrors } from '../utils/formErrors'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// pasang token dari api
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url
    const data = error.response?.data

    error.validationErrors = normalizeValidationErrors(data?.errors || {})
    error.userMessage = data?.message || 'Something went wrong'

    if (status === 401 && url !== '/login') {
      localStorage.removeItem('token')
      window.location.href = '/#/login'
    }

    if (status === 403) {
      window.location.href = '/#/403'
    }

    if (status === 404 && url !== '/me') {
      window.location.href = '/#/404'
    }

    if (status >= 500) {
      toastError('Server error. Please try again later.')
    }

    if (!error.response) {
      toastError('Network error. Please check your connection.')
    }

    return Promise.reject(error)
  },
)

export default api
