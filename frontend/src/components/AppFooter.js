import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  return (
    <CFooter className="px-4 text-body-secondary small">
      <div>
        <span className="fw-semibold text-body">Castra</span>
        <span className="ms-1">&copy; {new Date().getFullYear()} &bull; Made with ❤️</span>
      </div>
      <div className="ms-auto">
        <span className="me-1">Powered by</span>
        <a
          href="https://coreui.io/react"
          target="_blank"
          rel="noopener noreferrer"
          className="text-decoration-none"
        >
          CoreUI
        </a>
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
