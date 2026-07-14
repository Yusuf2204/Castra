import React, { useEffect, useState } from 'react'
import { CCard, CCardBody, CCardHeader, CSpinner } from '@coreui/react'
import { useSelector } from 'react-redux'
import CompanyForm from './CompanyForm'

const Company = () => {
  const company = useSelector((state) => state.company)

  if (!company) {
    return (
      <div className="d-flex align-items-center text-body-secondary py-3">
        <CSpinner size="sm" className="me-2" />
        Loading company settings...
      </div>
    )
  }

  return (
    <CCard>
      <CCardHeader>Company Settings</CCardHeader>
      <CCardBody>
        <CompanyForm company={company} />
      </CCardBody>
    </CCard>
  )
}

export default Company
