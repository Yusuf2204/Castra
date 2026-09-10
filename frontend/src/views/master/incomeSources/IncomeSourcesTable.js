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

const formatDateShort = (value) => {
  if (!value) return '-'

  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const IncomeSourcesTable = ({ incomeSources, loading, onSelect, onDelete }) => {
  if (loading) {
    return (
      <div className="d-flex align-items-center text-body-secondary py-3">
        <CSpinner size="sm" className="me-2" />
        Memuat sumber dana...
      </div>
    )
  }

  if (!incomeSources.length) {
    return <div className="text-body-secondary text-center py-4">Belum ada sumber dana.</div>
  }

  return (
    <CTable hover responsive>
      <CTableHead>
        <CTableRow>
          <CTableHeaderCell>Nama</CTableHeaderCell>
          <CTableHeaderCell>Deskripsi</CTableHeaderCell>
          <CTableHeaderCell>Status</CTableHeaderCell>
          <CTableHeaderCell>Update Terakhir</CTableHeaderCell>
          <CTableHeaderCell width={100}>Aksi</CTableHeaderCell>
        </CTableRow>
      </CTableHead>

      <CTableBody>
        {incomeSources.map((item) => (
          <CTableRow key={item.id}>
            <CTableDataCell onClick={() => onSelect(item)} style={{ cursor: 'pointer' }}>
              {item.name}
            </CTableDataCell>

            <CTableDataCell>{item.description || '-'}</CTableDataCell>

            <CTableDataCell>
              {item.is_active ? (
                <CBadge color="success">Aktif</CBadge>
              ) : (
                <CBadge color="secondary">Nonaktif</CBadge>
              )}
            </CTableDataCell>

            <CTableDataCell>{formatDateShort(item.updated_at)}</CTableDataCell>

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

              <CButton
                size="sm"
                color="danger"
                variant="ghost"
                title="Hapus"
                onClick={() => onDelete(item.id)}
              >
                <CIcon icon={cilTrash} />
              </CButton>
            </CTableDataCell>
          </CTableRow>
        ))}
      </CTableBody>
    </CTable>
  )
}

export default IncomeSourcesTable
