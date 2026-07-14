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

const MenusTable = ({ menus, loading, onSelect, onDelete }) => {
  if (loading) {
    return (
      <div className="d-flex align-items-center text-body-secondary py-3">
        <CSpinner size="sm" className="me-2" />
        Loading menus...
      </div>
    )
  }

  return (
    <CTable hover>
      <CTableHead>
        <CTableRow>
          <CTableHeaderCell>Name</CTableHeaderCell>
          <CTableHeaderCell>Path</CTableHeaderCell>
          <CTableHeaderCell>Parent</CTableHeaderCell>
          <CTableHeaderCell>Order</CTableHeaderCell>
          <CTableHeaderCell>Action</CTableHeaderCell>
        </CTableRow>
      </CTableHead>

      <CTableBody>
        {menus.map((m) => (
          <CTableRow key={m.id}>
            <CTableDataCell onClick={() => onSelect(m)} style={{ cursor: 'pointer' }}>
              {m.menu_name}
            </CTableDataCell>
            <CTableDataCell>{m.menu_path}</CTableDataCell>
            <CTableDataCell>{m.parent?.menu_name || '-'}</CTableDataCell>
            <CTableDataCell>{m.menu_order}</CTableDataCell>
            <CTableDataCell>
              <CButton size="sm" color="danger" onClick={() => onDelete(m.id)}>
                Delete
              </CButton>
            </CTableDataCell>
          </CTableRow>
        ))}
      </CTableBody>
    </CTable>
  )
}

export default MenusTable
