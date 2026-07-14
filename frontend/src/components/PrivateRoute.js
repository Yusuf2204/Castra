import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import api from '../services/api'

const PrivateRoute = ({ children }) => {
  const user = useSelector((state) => state.user)
  const [isValid, setIsValid] = useState(user ? true : null)
  const dispatch = useDispatch()

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token')

      if (!token) {
        setIsValid(false)
        return
      }

      if (user) {
        setIsValid(true)
        return
      }

      try {
        const res = await api.get('/me')
        dispatch({
          type: 'set',
          user: res.data.data.user,
          company: res.data.data.company,
          navigation: res.data.data.navigation || [],
        })
        setIsValid(true)
      } catch {
        localStorage.removeItem('token')
        setIsValid(false)
      }
    }

    validateToken()
  }, [dispatch, user])

  if (isValid === null) return null // atau spinner

  if (!isValid) return <Navigate to="/login" replace />

  return children
}

export default PrivateRoute
