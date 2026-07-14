import React from 'react'
import {
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CButton,
  CSpinner,
} from '@coreui/react'

const UsersTable = ({ users, loading, currentUserId, onSelect, onDelete }) => {
  if (loading) {
    return (
      <div className="d-flex align-items-center text-body-secondary py-3">
        <CSpinner size="sm" className="me-2" />
        Loading users...
      </div>
    )
  }

  return (
    <CTable hover>
      <CTableHead>
        <CTableRow>
          <CTableHeaderCell>Name</CTableHeaderCell>
          <CTableHeaderCell>Email</CTableHeaderCell>
          <CTableHeaderCell>Role</CTableHeaderCell>
          <CTableHeaderCell width={120}>Action</CTableHeaderCell>
        </CTableRow>
      </CTableHead>

      <CTableBody>
        {users.map((u) => {
          const isSelf = Number(u.id) === Number(currentUserId)

          return (
            <CTableRow key={u.id}>
              <CTableDataCell onClick={() => onSelect(u)} style={{ cursor: 'pointer' }}>
                {u.name}
              </CTableDataCell>

              <CTableDataCell>{u.email}</CTableDataCell>
              <CTableDataCell>{u.role?.role_name || '-'}</CTableDataCell>

              <CTableDataCell>
                <CButton
                  size="sm"
                  color="danger"
                  disabled={isSelf}
                  onClick={() => onDelete(u.id)}
                  title={isSelf ? 'You cannot delete your own account' : ''}
                >
                  Delete
                </CButton>
              </CTableDataCell>
            </CTableRow>
          )
        })}
      </CTableBody>
    </CTable>
  )
}

export default UsersTable
