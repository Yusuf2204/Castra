import React from 'react'
import { CButton, CCol, CContainer, CRow } from '@coreui/react'
import { Link } from 'react-router-dom'

const Page403 = () => (
  <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
    <CContainer>
      <CRow className="justify-content-center">
        <CCol md={6}>
          <div className="clearfix">
            <h1 className="float-start display-3 me-4">403</h1>
            <h4 className="pt-3">Forbidden</h4>
            <p className="text-body-secondary">You do not have permission to access this page.</p>
          </div>
          <Link to="/dashboard">
            <CButton color="primary">Back to Dashboard</CButton>
          </Link>
        </CCol>
      </CRow>
    </CContainer>
  </div>
)

export default Page403
