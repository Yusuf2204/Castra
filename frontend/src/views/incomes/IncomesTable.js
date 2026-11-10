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
import { cilPencil, cilTrash, cilImage, cilPrint, cilCloudDownload, cilFile, cilZoom } from '@coreui/icons'
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
            <CTableHeaderCell>Catatan</CTableHeaderCell>
            <CTableHeaderCell>Nominal</CTableHeaderCell>
            <CTableHeaderCell width={70} className="text-center">
              Bukti
            </CTableHeaderCell>
            <CTableHeaderCell width={140} className="text-center">Aksi</CTableHeaderCell>
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
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                  {item.income_source?.name || '-'}
                </span>
                {item.account && (
                  <div className="mt-1">
                    <span
                      className={`badge small ${
                        item.account.type === 'petty_cash'
                          ? 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                          : 'bg-secondary-subtle text-secondary border border-secondary-subtle'
                      }`}
                    >
                      {item.account.name}
                    </span>
                  </div>
                )}
              </CTableDataCell>

              <CTableDataCell>
                {item.category?.name ? (
                  <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle">
                    {item.category.name}
                  </span>
                ) : (
                  <span className="text-body-secondary">-</span>
                )}
              </CTableDataCell>

              <CTableDataCell>
                <span className="small text-body-secondary">{item.notes || '-'}</span>
              </CTableDataCell>

              <CTableDataCell className="text-success fw-semibold">
                +{formatCurrency(item.amount)}
              </CTableDataCell>

              <CTableDataCell className="text-center align-middle">
                {item.attachment_url || item.attachment_path ? (
                  (() => {
                    const url = item.attachment_url || `/storage/${item.attachment_path}`
                    const isPdf =
                      url.toLowerCase().includes('.pdf') ||
                      item.attachment_path?.toLowerCase().endsWith('.pdf')

                    if (isPdf) {
                      return (
                        <CButton
                          size="sm"
                          color="danger"
                          variant="ghost"
                          className="p-1 text-danger d-inline-flex align-items-center gap-1 border border-danger-subtle rounded bg-danger-subtle"
                          title="Buka Dokumen PDF Bukti Pemasukan"
                          onClick={() => setPreviewImage(url)}
                        >
                          <CIcon icon={cilFile} size="sm" />
                          <span style={{ fontSize: '10px', fontWeight: 'bold' }}>PDF</span>
                        </CButton>
                      )
                    }

                    return (
                      <div
                        role="button"
                        tabIndex={0}
                        title="Klik untuk melihat bukti transfer"
                        onClick={() => setPreviewImage(url)}
                        onKeyDown={(e) => e.key === 'Enter' && setPreviewImage(url)}
                        className="d-inline-block position-relative rounded overflow-hidden border shadow-sm cursor-pointer"
                        style={{ width: '38px', height: '38px', verticalAlign: 'middle' }}
                      >
                        <img
                          src={url}
                          alt="Bukti"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div
                          className="position-absolute bottom-0 start-0 end-0 text-center bg-dark bg-opacity-75 text-white"
                          style={{ fontSize: '8px', lineHeight: '11px' }}
                        >
                          <CIcon icon={cilZoom} style={{ width: '9px', height: '9px' }} />
                        </div>
                      </div>
                    )
                  })()
                ) : (
                  <span className="text-body-secondary small">-</span>
                )}
              </CTableDataCell>

              <CTableDataCell className="text-nowrap text-center">
                <CButton
                  size="sm"
                  color="success"
                  variant="ghost"
                  title="Cetak Voucher BKM"
                  className="p-1 me-1 text-success"
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
                  className="p-1 me-1"
                  onClick={() => onEdit(item)}
                >
                  <CIcon icon={cilPencil} />
                </CButton>

                <CButton
                  size="sm"
                  color="danger"
                  variant="ghost"
                  title="Hapus"
                  className="p-1"
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
            previewImage.toLowerCase().includes('.pdf') ? (
              <iframe
                src={previewImage}
                title="Bukti Transfer"
                width="100%"
                height="500px"
                className="border rounded bg-white"
              />
            ) : (
              <img
                src={previewImage}
                alt="Bukti Transfer"
                className="img-fluid rounded shadow-sm border"
                style={{ maxHeight: '75vh', objectFit: 'contain' }}
              />
            )
          )}
        </CModalBody>
        <CModalFooter className="d-flex justify-content-between align-items-center">
          <div>
            {previewImage && (
              <a
                href={previewImage}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
              >
                <CIcon icon={cilCloudDownload} />
                Unduh / Buka File Asli
              </a>
            )}
          </div>
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
