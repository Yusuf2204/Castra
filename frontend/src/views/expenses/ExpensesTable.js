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
  if (val === null || val === undefined || val === '') return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(val))
}

const formatDateShort = (value) => {
  if (!value) return '-'
  const [y, m, d] = String(value).substring(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const ExpensesTable = ({ expenses = [], loading, onEdit, onDelete }) => {
  if (loading) {
    return (
      <div className="d-flex align-items-center text-body-secondary py-4 justify-content-center">
        <CSpinner size="sm" className="me-2" />
        Memuat daftar transaksi pengeluaran...
      </div>
    )
  }

  if (!expenses.length) {
    return (
      <div className="text-body-secondary text-center py-5">
        Belum ada data transaksi pengeluaran pada periode ini.
      </div>
    )
  }

  return (
    <CTable hover responsive align="middle">
      <CTableHead className="table-light">
        <CTableRow>
          <CTableHeaderCell>Tanggal</CTableHeaderCell>
          <CTableHeaderCell>Kategori</CTableHeaderCell>
          <CTableHeaderCell>Kelompok</CTableHeaderCell>
          <CTableHeaderCell>Nominal</CTableHeaderCell>
          <CTableHeaderCell>Catatan</CTableHeaderCell>
          <CTableHeaderCell width={100}>Aksi</CTableHeaderCell>
        </CTableRow>
      </CTableHead>

      <CTableBody>
        {expenses.map((item) => (
          <CTableRow key={item.id}>
            <CTableDataCell>
              <strong>{formatDateShort(item.transaction_date)}</strong>
            </CTableDataCell>

            <CTableDataCell>
              <strong>{item.category?.name || '-'}</strong>
            </CTableDataCell>

            <CTableDataCell>
              {item.category?.budget_group ? (
                <CBadge color="info">
                  {item.category.budget_group.name} ({item.category.budget_group.percentage}%)
                </CBadge>
              ) : (
                <span className="text-body-secondary">-</span>
              )}
            </CTableDataCell>

            <CTableDataCell className="text-danger fw-bold">
              -{formatCurrency(item.amount)}
            </CTableDataCell>

            <CTableDataCell>{item.notes || '-'}</CTableDataCell>

            <CTableDataCell>
              <CButton
                size="sm"
                color="secondary"
                variant="ghost"
                title="Edit"
                className="me-1"
                onClick={() => onEdit(item)}
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

export default ExpensesTable
