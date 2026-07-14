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
import { useSelector } from 'react-redux'
import UsersTable from './UsersTable'
import UsersForm from './UsersForm'
import api from '../../../services/api'
import { toastSuccess } from '../../../services/toastService'

const Users = () => {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const currentUser = useSelector((state) => state.user)
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/users')
      setUsers(res.data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSaved = () => {
    setSelectedUser(null)
    fetchUsers()
  }

  const handleAskDelete = (id) => {
    setDeleteId(id)
    setConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/users/${deleteId}`)
      toastSuccess('User deleted')
      fetchUsers()
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
            User List
            <CButton size="sm" color="secondary" onClick={fetchUsers}>
              <CIcon icon={cilReload} />
            </CButton>
          </CCardHeader>
          <CCardBody>
            <UsersTable
              users={users}
              loading={loading}
              currentUserId={currentUser?.id}
              onSelect={setSelectedUser}
              onDelete={handleAskDelete}
            />
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md={5}>
        <CCard>
          <CCardHeader>{selectedUser ? 'Edit User' : 'Add User'}</CCardHeader>
          <CCardBody>
            <UsersForm
              user={selectedUser}
              onReset={() => setSelectedUser(null)}
              onSaved={handleSaved}
            />
          </CCardBody>
        </CCard>
      </CCol>

      <CModal visible={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <CModalHeader>
          <CModalTitle>Confirm Delete</CModalTitle>
        </CModalHeader>

        <CModalBody>Are you sure you want to delete this user?</CModalBody>

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

export default Users
