import React, { useEffect, useState } from 'react'
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react'
import { CIcon } from '@coreui/icons-react'
import { cilReload } from '@coreui/icons'
import RolesTable from './RolesTable'
import RolesForm from './RolesForm'
import api from '../../../services/api'
import { toastSuccess } from '../../../services/toastService'

const Roles = () => {
  const [roles, setRoles] = useState([])
  const [selectedRole, setSelectedRole] = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchRoles = async () => {
    setLoading(true)
    try {
      const res = await api.get('/roles')
      setRoles(res.data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  const handleSaved = () => {
    setSelectedRole(null)
    fetchRoles()
  }

  const handleAskDelete = (id) => {
    setDeleteId(id)
    setConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/roles/${deleteId}`)
      toastSuccess('Role deleted')
      fetchRoles()
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
      setDeleteId(null)
    }
  }

  return (
    <CRow>
      <CCol md={7}>
        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            Roles
            <CButton size="sm" color="secondary" onClick={fetchRoles}>
              <CIcon icon={cilReload} />
            </CButton>
          </CCardHeader>
          <CCardBody>
            <RolesTable
              roles={roles}
              loading={loading}
              onSelect={setSelectedRole}
              onDelete={handleAskDelete}
            />
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md={5}>
        <CCard>
          <CCardHeader>{selectedRole ? 'Edit Role' : 'Add Role'}</CCardHeader>
          <CCardBody>
            <RolesForm
              role={selectedRole}
              onReset={() => setSelectedRole(null)}
              onSaved={handleSaved}
            />
          </CCardBody>
        </CCard>
      </CCol>

      <CModal visible={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <CModalHeader>
          <CModalTitle>Confirm Delete</CModalTitle>
        </CModalHeader>

        <CModalBody>Are you sure you want to delete this role?</CModalBody>

        <CModalFooter>
          <CButton color="secondary" onClick={() => setConfirmOpen(false)}>
            Cancel
          </CButton>
          <CButton color="danger" onClick={handleConfirmDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </CButton>
        </CModalFooter>
      </CModal>
    </CRow>
  )
}

export default Roles
