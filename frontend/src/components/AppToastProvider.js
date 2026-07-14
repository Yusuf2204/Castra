import React, { useEffect, useState } from 'react'
import { CToast, CToastBody, CToastClose, CToastHeader, CToaster } from '@coreui/react'

const AppToastProvider = () => {
  const [toast, addToast] = useState()

  useEffect(() => {
    const handleToast = (event) => {
      const { color = 'success', title = 'Notification', message = '' } = event.detail || {}

      addToast(
        <CToast autohide color={color} className="text-white align-items-center">
          <CToastHeader closeButton={false}>
            <strong className="me-auto">{title}</strong>
            <CToastClose className="me-2 m-auto" white />
          </CToastHeader>
          <CToastBody>{message}</CToastBody>
        </CToast>,
      )
    }

    window.addEventListener('app:toast', handleToast)

    return () => window.removeEventListener('app:toast', handleToast)
  }, [])

  return <CToaster push={toast} placement="top-end" className="p-3" />
}

export default AppToastProvider
