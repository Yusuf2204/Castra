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
import { cilPencil, cilTrash, cilImage, cilPrint, cilCheck, cilXCircle, cilCloudDownload, cilFile, cilZoom } from '@coreui/icons'
import api from '../../services/api'
import { toastSuccess, toastError } from '../../services/toastService'
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

const ExpensesTable = ({ expenses = [], loading, onEdit, onDelete, onReload }) => {
  const [previewImage, setPreviewImage] = useState(null)
  const [selectedVoucher, setSelectedVoucher] = useState(null)
  const [showVoucherModal, setShowVoucherModal] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState(null)

  const handleApprove = async (id) => {
    setActionLoadingId(id)
    try {
      await api.post(`/expenses/${id}/approve`)
      toastSuccess('Voucher pengeluaran berhasil disetujui (Approved)')
      onReload?.()
    } catch (err) {
      toastError(err.userMessage || 'Gagal menyetujui voucher')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleReject = async (id) => {
    setActionLoadingId(id)
    try {
      await api.post(`/expenses/${id}/reject`)
      toastSuccess('Voucher pengeluaran ditolak (Rejected)')
      onReload?.()
    } catch (err) {
      toastError(err.userMessage || 'Gagal menolak voucher')
    } finally {
      setActionLoadingId(null)
    }
  }

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
    <>
      <CTable hover responsive align="middle">
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell>No. Bukti / Tanggal</CTableHeaderCell>
            <CTableHeaderCell>Kategori</CTableHeaderCell>
            <CTableHeaderCell>Kelompok</CTableHeaderCell>
            <CTableHeaderCell>Penerima & Catatan</CTableHeaderCell>
            <CTableHeaderCell>Status</CTableHeaderCell>
            <CTableHeaderCell>Nominal</CTableHeaderCell>
            <CTableHeaderCell width={70} className="text-center">
              Nota
            </CTableHeaderCell>
            <CTableHeaderCell width={140}>Aksi</CTableHeaderCell>
          </CTableRow>
        </CTableHead>

        <CTableBody>
          {expenses.map((item) => (
            <CTableRow key={item.id}>
              <CTableDataCell>
                {item.voucher_no && (
                  <div className="small font-monospace text-secondary mb-1">{item.voucher_no}</div>
                )}
                <strong>{formatDateShort(item.transaction_date)}</strong>
              </CTableDataCell>

              <CTableDataCell>
                <strong>{item.category?.name || '-'}</strong>
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
                {item.category?.budget_group ? (
                  <CBadge color="info">
                    {item.category.budget_group.name} ({item.category.budget_group.percentage}%)
                  </CBadge>
                ) : (
                  <span className="text-body-secondary">-</span>
                )}
              </CTableDataCell>

              <CTableDataCell>
                {item.payee && (
                  <div className="fw-semibold text-body small">Penerima: {item.payee}</div>
                )}
                <span className="small text-body-secondary">{item.notes || '-'}</span>
              </CTableDataCell>

              <CTableDataCell>
                {item.status === 'approved' ? (
                  <CBadge color="success">Disetujui</CBadge>
                ) : item.status === 'submitted' ? (
                  <CBadge color="warning">Menunggu</CBadge>
                ) : item.status === 'rejected' ? (
                  <CBadge color="danger">Ditolak</CBadge>
                ) : (
                  <CBadge color="secondary">Draft</CBadge>
                )}
                {item.children && item.children.length > 0 && (
                  <div className="mt-1">
                    <CBadge color="info" className="small">
                      Split ({item.children.length})
                    </CBadge>
                  </div>
                )}
              </CTableDataCell>

              <CTableDataCell className="text-danger fw-bold">
                -{formatCurrency(item.amount)}
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
                          title="Buka Dokumen PDF Bukti Pengeluaran"
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
                        title="Klik untuk melihat foto nota"
                        onClick={() => setPreviewImage(url)}
                        onKeyDown={(e) => e.key === 'Enter' && setPreviewImage(url)}
                        className="d-inline-block position-relative rounded overflow-hidden border shadow-sm cursor-pointer"
                        style={{ width: '38px', height: '38px', verticalAlign: 'middle' }}
                      >
                        <img
                          src={url}
                          alt="Nota"
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

              <CTableDataCell>
                {/* Inline Quick Approve / Reject for Maker-Approver Workflow */}
                {item.status !== 'approved' && (
                  <>
                    <CButton
                      size="sm"
                      color="success"
                      variant="ghost"
                      title="Setujui Voucher"
                      className="p-1 me-1 text-success"
                      disabled={actionLoadingId === item.id}
                      onClick={() => handleApprove(item.id)}
                    >
                      <CIcon icon={cilCheck} />
                    </CButton>
                    {item.status !== 'rejected' && (
                      <CButton
                        size="sm"
                        color="danger"
                        variant="ghost"
                        title="Tolak Voucher"
                        className="p-1 me-1 text-danger"
                        disabled={actionLoadingId === item.id}
                        onClick={() => handleReject(item.id)}
                      >
                        <CIcon icon={cilXCircle} />
                      </CButton>
                    )}
                  </>
                )}

                <CButton
                  size="sm"
                  color="primary"
                  variant="ghost"
                  title="Cetak Voucher BKK"
                  className="p-1 me-1 text-primary"
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
            Bukti Struk / Nota Fisik
          </CModalTitle>
        </CModalHeader>
        <CModalBody className="text-center p-3 bg-body-tertiary">
          {previewImage && (
            previewImage.toLowerCase().includes('.pdf') ? (
              <iframe
                src={previewImage}
                title="Bukti Nota"
                width="100%"
                height="500px"
                className="border rounded bg-white"
              />
            ) : (
              <img
                src={previewImage}
                alt="Bukti Nota"
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
        type="expense"
      />
    </>
  )
}

export default ExpensesTable
