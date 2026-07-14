import React from 'react'
import {
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from '@coreui/react'

const RolepermissionsTable = ({ roles, onSelect }) => {
  return (
    <CTable hover>
      <CTableHead>
        <CTableRow>
          <CTableHeaderCell>Role</CTableHeaderCell>
        </CTableRow>
      </CTableHead>
      <CTableBody>
        {roles.map((r) => (
          <CTableRow key={r.id} onClick={() => onSelect(r)} style={{ cursor: 'pointer' }}>
            <CTableDataCell>{r.role_name}</CTableDataCell>
          </CTableRow>
        ))}
      </CTableBody>
    </CTable>
  )
}

export default RolepermissionsTable
