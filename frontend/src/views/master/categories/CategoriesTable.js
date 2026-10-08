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

const formatCurrency = (val) => {
  if (val === null || val === undefined || val === '') return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(val))
}

const formatDateShort = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const CategoriesTable = ({ categories, loading, type, onSelect, onDelete }) => {
  if (loading) {
    return (
      <div className="d-flex align-items-center text-body-secondary py-3">
        <CSpinner size="sm" className="me-2" />
        Memuat kategori...
      </div>
    )
  }

  if (!categories.length) {
    return (
      <div className="text-body-secondary text-center py-4">
        Belum ada kategori {type === 'expense' ? 'pengeluaran' : 'pemasukan'}.
      </div>
    )
  }

  return (
    <CTable hover responsive>
      <CTableHead>
        <CTableRow>
          <CTableHeaderCell>Nama</CTableHeaderCell>
          {type === 'expense' && <CTableHeaderCell>Kelompok Anggaran</CTableHeaderCell>}
          {type === 'expense' && <CTableHeaderCell>Estimasi Default (Baseline)</CTableHeaderCell>}
          <CTableHeaderCell>Status</CTableHeaderCell>
          <CTableHeaderCell>Update Terakhir</CTableHeaderCell>
          <CTableHeaderCell width={100}>Aksi</CTableHeaderCell>
        </CTableRow>
      </CTableHead>

      <CTableBody>
        {categories.map((item) => (
          <CTableRow key={item.id}>
            <CTableDataCell onClick={() => onSelect(item)} style={{ cursor: 'pointer' }}>
              <strong>{item.name}</strong>
            </CTableDataCell>

            {type === 'expense' && (
              <CTableDataCell>
                {item.budget_group ? (
                  <CBadge color="info">
                    {item.budget_group.name} ({item.budget_group.percentage}%)
                  </CBadge>
                ) : (
                  <span className="text-body-secondary">-</span>
                )}
              </CTableDataCell>
            )}

            {type === 'expense' && (
              <CTableDataCell>{formatCurrency(item.monthly_estimate)}</CTableDataCell>
            )}

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

export default CategoriesTable
