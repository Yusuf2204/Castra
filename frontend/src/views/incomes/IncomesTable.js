import React, { useState } from 'react'
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
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react'
import { CIcon } from '@coreui/icons-react'
import { cilPencil, cilTrash, cilImage, cilPrint } from '@coreui/icons'
import VoucherModal from '../../components/vouchers/VoucherModal'

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

const IncomesTable = ({ incomes = [], loading, onEdit, onDelete }) => {
  const [previewImage, setPreviewImage] = useState(null)
  const [selectedVoucher, setSelectedVoucher] = useState(null)
  const [showVoucherModal, setShowVoucherModal] = useState(false)

  if (loading) {
    return (
      <div className="d-flex align-items-center text-body-secondary py-4 justify-content-center">
        <CSpinner size="sm" className="me-2" />
        Memuat daftar transaksi pemasukan...
      </div>
    )
  }

  if (!incomes.length) {
    return (
      <div className="text-body-secondary text-center py-5">
        Belum ada data transaksi pemasukan pada periode ini.
      </div>
    )
  }

  return (
    <>
      <CTable hover responsive align="middle">
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell>No. Bukti / Tanggal</CTableHeaderCell>
            <CTableHeaderCell>Sumber Dana</CTableHeaderCell>
            <CTableHeaderCell>Kategori</CTableHeaderCell>
            <CTableHeaderCell>Nominal</CTableHeaderCell>
            <CTableHeaderCell>Catatan</CTableHeaderCell>
            <CTableHeaderCell width={70} className="text-center">
              Bukti
            </CTableHeaderCell>
            <CTableHeaderCell width={100}>Aksi</CTableHeaderCell>
          </CTableRow>
        </CTableHead>

        <CTableBody>
          {incomes.map((item) => (
            <CTableRow key={item.id}>
              <CTableDataCell>
                {item.voucher_no && (
                  <div className="small font-monospace text-secondary mb-1">{item.voucher_no}</div>
                )}
                <strong>{formatDateShort(item.transaction_date)}</strong>
              </CTableDataCell>

              <CTableDataCell>
                <CBadge color="primary" variant="outline">
                  {item.income_source?.name || '-'}
                </CBadge>
                {item.account && (
                  <div className="mt-1">
                    <CBadge
                      color={item.account.type === 'petty_cash' ? 'warning' : 'secondary'}
                      className="small"
                    >
                      {item.account.name}
                    </CBadge>
                  </div>
                )}
              </CTableDataCell>

              <CTableDataCell>
                {item.category?.name ? (
                  <CBadge color="info">{item.category.name}</CBadge>
                ) : (
                  <span className="text-body-secondary">-</span>
                )}
              </CTableDataCell>

              <CTableDataCell className="text-success fw-bold">
                {formatCurrency(item.amount)}
              </CTableDataCell>

              <CTableDataCell>{item.notes || '-'}</CTableDataCell>

              <CTableDataCell className="text-center">
                {item.attachment_url ? (
                  <CButton
                    size="sm"
                    color="info"
                    variant="ghost"
                    className="p-1 text-info"
                    title="Lihat Bukti Transfer"
                    onClick={() => setPreviewImage(item.attachment_url)}
                  >
                    <CIcon icon={cilImage} size="lg" />
                  </CButton>
                ) : (
                  <span className="text-body-secondary small">-</span>
                )}
              </CTableDataCell>

              <CTableDataCell>
                <CButton
                  size="sm"
                  color="success"
                  variant="ghost"
                  title="Cetak Voucher BKM"
                  className="me-1 text-success"
                  onClick={() => {
                    setSelectedVoucher(item)
                    setShowVoucherModal(true)
                  }}
                >
                  <CIcon icon={cilPrint} />
                </CButton>

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

      {/* Lightbox Modal */}
      <CModal size="lg" visible={Boolean(previewImage)} onClose={() => setPreviewImage(null)}>
        <CModalHeader closeButton>
          <CModalTitle className="d-flex align-items-center gap-2">
            <CIcon icon={cilImage} className="text-primary" />
            Bukti Transfer / Pemasukan
          </CModalTitle>
        </CModalHeader>
        <CModalBody className="text-center p-3 bg-body-tertiary">
          {previewImage && (
            <img
              src={previewImage}
              alt="Bukti Transfer"
              className="img-fluid rounded shadow-sm border"
              style={{ maxHeight: '75vh', objectFit: 'contain' }}
            />
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setPreviewImage(null)}>
            Tutup
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Voucher Print Modal */}
      <VoucherModal
        visible={showVoucherModal}
        onClose={() => setShowVoucherModal(false)}
        transaction={selectedVoucher}
        type="income"
      />
    </>
  )
}

export default IncomesTable
