import React, { useEffect, useState } from 'react'
import { CRow, CCol, CCard, CCardBody, CCardHeader } from '@coreui/react'
import RolesTable from './RolepermissionsTable'
import PermissionsForm from './RolepermissionsForm'
import api from '../../../services/api'

const RolePermissions = () => {
  const [roles, setRoles] = useState([])
  const [selectedRole, setSelectedRole] = useState(null)

  useEffect(() => {
    const fetchRoles = async () => {
      const res = await api.get('/roles')
      setRoles(res.data.data)
    }
    fetchRoles()
  }, [])

  return (
    <CRow>
      <CCol md={5}>
        <CCard>
          <CCardHeader>Roles</CCardHeader>
          <CCardBody>
            <RolesTable roles={roles} onSelect={setSelectedRole} />
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md={7}>
        <CCard>
          <CCardHeader>
            {selectedRole ? `Permissions - ${selectedRole.role_name}` : 'Select Role'}
          </CCardHeader>
          <CCardBody>{selectedRole && <PermissionsForm role={selectedRole} />}</CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default RolePermissions
