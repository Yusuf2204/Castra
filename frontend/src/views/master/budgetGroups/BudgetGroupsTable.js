import React from 'react'
import {
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CButton,
  CBadge,
  CSpinner,
} from '@coreui/react'
import { CIcon } from '@coreui/icons-react'
import { cilPencil, cilTrash } from '@coreui/icons'

const BudgetGroupsTable = ({ budgetGroups, loading, onSelect, onDelete }) => {
  if (loading) {
    return (
      <div className="d-flex align-items-center text-body-secondary py-3">
        <CSpinner size="sm" className="me-2" />
        Memuat kelompok anggaran...
      </div>
    )
  }

  if (!budgetGroups.length) {
    return <div className="text-body-secondary text-center py-4">Belum ada kelompok anggaran.</div>
  }

  return (
    <CTable hover responsive>
      <CTableHead>
        <CTableRow>
          <CTableHeaderCell>Urutan</CTableHeaderCell>
          <CTableHeaderCell>Kode</CTableHeaderCell>
          <CTableHeaderCell>Nama Kelompok</CTableHeaderCell>
          <CTableHeaderCell>Alokasi (%)</CTableHeaderCell>
          <CTableHeaderCell>Status</CTableHeaderCell>
          <CTableHeaderCell>Kategori Terkait</CTableHeaderCell>
          <CTableHeaderCell width={100}>Aksi</CTableHeaderCell>
        </CTableRow>
      </CTableHead>

      <CTableBody>
        {budgetGroups.map((item) => (
          <CTableRow key={item.id}>
            <CTableDataCell>{item.sort_order}</CTableDataCell>
            <CTableDataCell>
              <code>{item.code}</code>
            </CTableDataCell>
            <CTableDataCell onClick={() => onSelect(item)} style={{ cursor: 'pointer' }}>
              <strong>{item.name}</strong>
              {item.is_system && (
                <CBadge color="info" className="ms-2">
                  Sistem
                </CBadge>
              )}
            </CTableDataCell>
            <CTableDataCell>
              <CBadge color="primary">{item.percentage}%</CBadge>
            </CTableDataCell>
            <CTableDataCell>
              {item.is_active ? (
                <CBadge color="success">Aktif</CBadge>
              ) : (
                <CBadge color="secondary">Nonaktif</CBadge>
              )}
            </CTableDataCell>
            <CTableDataCell>{item.categories_count ?? 0} kategori</CTableDataCell>
            <CTableDataCell>
              <CButton
                size="sm"
                color="secondary"
                variant="ghost"
                title="Edit"
                className="me-1"
                onClick={() => onSelect(item)}
              >
                <CIcon icon={cilPencil} />
              </CButton>

              {!item.is_system && (
                <CButton
                  size="sm"
                  color="danger"
                  variant="ghost"
                  title="Hapus"
                  onClick={() => onDelete(item.id)}
                >
                  <CIcon icon={cilTrash} />
                </CButton>
              )}
            </CTableDataCell>
          </CTableRow>
        ))}
      </CTableBody>
    </CTable>
  )
}

export default BudgetGroupsTable
