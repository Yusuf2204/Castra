import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CBadge,
  CSpinner,
} from '@coreui/react'
import { CIcon } from '@coreui/icons-react'
import { cilPrint, cilCheckCircle, cilFile, cilExternalLink, cilPaperclip, cilCloudDownload } from '@coreui/icons'
import { terbilang } from '../../utils/terbilang'
import api from '../../services/api'

const formatCurrency = (val) => {
  if (val === null || val === undefined || val === '') return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(val))
}

const formatDateLong = (dateStr) => {
  if (!dateStr) return '-'
  const [year, month, day] = String(dateStr).substring(0, 10).split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const VoucherModal = ({ visible, onClose, transaction, type = 'expense' }) => {
  const company = useSelector((state) => state.company)
  const [includeReceipt, setIncludeReceipt] = useState(true)
  const [downloading, setDownloading] = useState(false)

  if (!transaction) return null

  const receiptUrl =
    transaction.attachment_url ||
    (transaction.attachment_path
      ? (transaction.attachment_path.startsWith('http')
          ? transaction.attachment_path
          : `/storage/${transaction.attachment_path}`)
      : null)
  const isPdf =
    receiptUrl?.toLowerCase().endsWith('.pdf') ||
    transaction.attachment_path?.toLowerCase().endsWith('.pdf')

  const isExpense = type === 'expense' || transaction.voucher_no?.startsWith('BKK')
  const voucherTitle = isExpense ? 'BUKTI KAS KELUAR (BKK)' : 'BUKTI KAS MASUK (BKM)'
  const voucherBadge = isExpense ? 'danger' : 'success'
  const partyLabel = isExpense ? 'Dibayarkan Kepada' : 'Diterima Dari'
  const partyValue = isExpense
    ? transaction.payee || '-'
    : transaction.category?.name || transaction.income_source?.name || transaction.payee || '-'

  const handleDownloadPdf = async (stream = false) => {
    try {
      setDownloading(true)
      const endpoint = isExpense
        ? `/expenses/${transaction.id}/pdf`
        : `/incomes/${transaction.id}/pdf`

      const response = await api.get(endpoint, {
        params: {
          include_receipt: includeReceipt ? 1 : 0,
          download: stream ? 0 : 1,
        },
        responseType: 'blob',
      })

      const blob = new Blob([response.data], { type: 'application/pdf' })
      const blobUrl = window.URL.createObjectURL(blob)

      if (stream) {
        window.open(blobUrl, '_blank')
      } else {
        const link = document.createElement('a')
        link.href = blobUrl
        const cleanNo = (transaction.voucher_no || (isExpense ? `BKK_${transaction.id}` : `BKM_${transaction.id}`)).replace(/[^A-Za-z0-9_\-]/g, '_')
        link.download = `Voucher_${cleanNo}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000)
    } catch (err) {
      console.error('Failed to generate PDF:', err)
    } finally {
      setDownloading(false)
    }
  }

  const handlePrint = () => {
    handleDownloadPdf(true)
  }

  return (
    <CModal size="lg" visible={visible} onClose={onClose} backdrop="static">
      <CModalHeader closeButton className="d-print-none">
        <CModalTitle className="d-flex align-items-center gap-2">
          <span>Voucher Transaksi Keuangan</span>
          <CBadge color={voucherBadge}>{isExpense ? 'Pengeluaran' : 'Pemasukan'}</CBadge>
        </CModalTitle>
      </CModalHeader>

      <CModalBody className="p-4 voucher-print-area">
        <style>
          {`
            .voucher-paper-sheet,
            .voucher-paper-sheet * {
              color: #111827 !important;
              --cui-body-color: #111827 !important;
              --cui-table-color: #111827 !important;
            }
            .voucher-paper-sheet .bg-light,
            .voucher-paper-sheet .bg-light-subtle {
              background-color: #f3f4f6 !important;
              color: #111827 !important;
            }
            .voucher-paper-sheet .text-muted {
              color: #6b7280 !important;
            }
            .voucher-paper-sheet .text-dark {
              color: #111827 !important;
            }
            .voucher-paper-sheet .border-dark {
              border-color: #111827 !important;
            }
            .voucher-paper-sheet .table {
              --cui-table-color: #111827 !important;
              --cui-table-bg: transparent !important;
              color: #111827 !important;
            }
            .voucher-paper-sheet .badge.border-dark {
              color: #111827 !important;
              border-color: #111827 !important;
            }
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            @media print {
              html, body {
                background: #ffffff !important;
                overflow: visible !important;
                height: auto !important;
              }
              .sidebar,
              .header,
              .footer,
              .d-print-none,
              .modal-backdrop,
              .btn,
              button {
                display: none !important;
              }
              .modal {
                position: static !important;
                overflow: visible !important;
                display: block !important;
                padding: 0 !important;
              }
              .modal-dialog {
                position: static !important;
                max-width: 100% !important;
                width: 100% !important;
                margin: 0 !important;
                transform: none !important;
              }
              .modal-content {
                position: static !important;
                border: none !important;
                box-shadow: none !important;
                background: transparent !important;
              }
              .voucher-print-area {
                position: static !important;
                width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
                background: transparent !important;
              }
              .voucher-paper-sheet {
                border: 2px solid #111827 !important;
                padding: 1.25rem !important;
                margin: 0 auto !important;
                width: 100% !important;
                max-width: 100% !important;
                box-sizing: border-box !important;
              }
              .voucher-receipt-section {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
                margin-top: 1.5rem !important;
              }
              .voucher-receipt-section img {
                max-height: 480px !important;
                display: block !important;
                margin: 0 auto !important;
              }
              .table-responsive {
                overflow: visible !important;
                display: block !important;
                width: 100% !important;
              }
              table.table {
                width: 100% !important;
                border-collapse: collapse !important;
              }
              table.table th,
              table.table td {
                padding: 5px 8px !important;
                border-color: #111827 !important;
                color: #111827 !important;
              }
              .voucher-signatures {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
            }
          `}
        </style>

        {/* Voucher Container Sheet */}
        <div className="voucher-paper-sheet border border-2 border-dark p-4 bg-white text-dark rounded-1">
          {/* Title Dokumen (Tanpa Kop Surat sesuai arahan) */}
          <div className="d-flex justify-content-between align-items-center border-bottom border-dark pb-3 mb-3">
            <div>
              <h4 className="fw-bold mb-0 text-uppercase tracking-wide">{voucherTitle}</h4>
              <div className="small text-muted">
                Akun: <strong>{transaction.account?.name || (isExpense ? 'Kas Kecil' : 'Kas Utama')}</strong>
              </div>
            </div>
            <div className="text-end">
              <span className="badge border border-dark text-dark fs-6 px-3 py-1 font-monospace">
                {transaction.voucher_no || (isExpense ? 'BKK-DRAFT' : 'BKM-DRAFT')}
              </span>
              <div className="mt-1">
                {transaction.status === 'approved' ? (
                  <span className="badge bg-success-subtle text-success border border-success small">
                    APPROVED
                  </span>
                ) : transaction.status === 'submitted' ? (
                  <span className="badge bg-warning-subtle text-warning border border-warning small">
                    PENDING APPROVAL
                  </span>
                ) : transaction.status === 'rejected' ? (
                  <span className="badge bg-danger-subtle text-danger border border-danger small">
                    REJECTED
                  </span>
                ) : (
                  <span className="badge bg-secondary-subtle text-secondary border border-secondary small">
                    DRAFT
                  </span>
                )}
              </div>
              <div className="small text-muted mt-1">
                Tanggal: {formatDateLong(transaction.transaction_date)}
              </div>
            </div>
          </div>

          {/* Metadata Table */}
          <div className="table-responsive my-3">
            <table className="table table-bordered border-dark align-middle mb-0">
              <tbody>
                <tr>
                  <td className="bg-light fw-bold" style={{ width: '28%' }}>
                    {partyLabel}
                  </td>
                  <td className="fw-semibold fs-6">{partyValue}</td>
                </tr>
                <tr>
                  <td className="bg-light fw-bold">Nominal Pembayaran</td>
                  <td>
                    <span className="fs-5 fw-bold text-dark text-nowrap">
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="bg-light fw-bold">Terbilang</td>
                  <td className="fst-italic text-uppercase small bg-light-subtle fw-semibold">
                    &ldquo;{terbilang(transaction.amount)}&rdquo;
                  </td>
                </tr>
                <tr>
                  <td className="bg-light fw-bold">Untuk Keperluan / Pos</td>
                  <td>
                    <span className="fw-semibold">
                      {transaction.category?.name ||
                        (isExpense ? 'Pengeluaran Umum' : 'Pemasukan Umum')}
                    </span>
                    {transaction.category?.budget_group && (
                      <span className="text-muted ms-2 small">
                        ({transaction.category.budget_group.name})
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="bg-light fw-bold">Catatan / Keterangan</td>
                  <td>{transaction.notes || '-'}</td>
                </tr>
                {receiptUrl && (
                  <tr>
                    <td className="bg-light fw-bold">Bukti Fisik / Nota</td>
                    <td>
                      <span className="text-success small fw-semibold">
                        <CIcon icon={cilCheckCircle} className="me-1" />
                        Bukti nota fisik terlampir dan terverifikasi di sistem
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Split Items Breakdown if any */}
          {transaction.children && transaction.children.length > 0 && (
            <div className="my-3">
              <div className="small fw-bold text-muted mb-1">Rincian Alokasi Split Kategori:</div>
              <table className="table table-sm table-bordered border-dark small mb-0">
                <thead>
                  <tr className="bg-light">
                    <th>Pos Kategori</th>
                    <th>Keterangan</th>
                    <th className="text-end text-nowrap">Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {transaction.children.map((child, i) => (
                    <tr key={i}>
                      <td>{child.category?.name || '-'}</td>
                      <td>{child.notes || '-'}</td>
                      <td className="text-end fw-bold text-nowrap">
                        {formatCurrency(child.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Kotak Tanda Tangan 3 Kolom */}
          <div className="row text-center mt-4 pt-2 voucher-signatures">
            <div className="col-4">
              <div className="small text-muted mb-1">Disetujui Oleh:</div>
              <div
                className="border-bottom border-dark d-flex align-items-center justify-content-center"
                style={{ height: '65px' }}
              >
                {transaction.status === 'approved' && (
                  <span className="badge bg-success-subtle text-success border border-success small">
                    ✓ APPROVED
                  </span>
                )}
              </div>
              <div className="small fw-bold mt-1">
                ( {transaction.approver?.name || 'Pimpinan / Atasan'} )
              </div>
            </div>
            <div className="col-4">
              <div className="small text-muted mb-1">Dibukukan / Kasir:</div>
              <div className="border-bottom border-dark" style={{ height: '65px' }}></div>
              <div className="small fw-bold mt-1">( Pengelola Kas Kecil )</div>
            </div>
            <div className="col-4">
              <div className="small text-muted mb-1">
                {isExpense ? 'Diterima Oleh:' : 'Disetor Oleh:'}
              </div>
              <div className="border-bottom border-dark" style={{ height: '65px' }}></div>
              <div className="small fw-bold mt-1">
                ( {partyValue !== '-' ? partyValue : 'Penerima Uang'} )
              </div>
            </div>
          </div>

          {/* Lampiran Bukti Fisik / Nota Belanja Asli */}
          {includeReceipt && receiptUrl && (
            <div className="voucher-receipt-section mt-4 pt-3 border-top">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-bold small text-uppercase d-flex align-items-center gap-1">
                  <CIcon icon={cilPaperclip} className="text-primary" />
                  Lampiran Bukti Fisik / Nota Transaksi Asli
                </span>
                <span className="small text-muted font-monospace">
                  No. Bukti: {transaction.voucher_no || '-'}
                </span>
              </div>
              {isPdf ? (
                <div className="p-3 border rounded bg-light text-center">
                  <CIcon icon={cilFile} size="2xl" className="text-danger mb-1" />
                  <div className="fw-bold small">Dokumen PDF Terlampir di Sistem</div>
                  <div className="small font-monospace text-muted mb-2">
                    {transaction.attachment_path?.split('/').pop() || 'dokumen.pdf'}
                  </div>
                  <a
                    href={receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-danger d-print-none"
                  >
                    <CIcon icon={cilExternalLink} className="me-1" />
                    Buka Dokumen PDF Asli
                  </a>
                </div>
              ) : (
                <div className="text-center p-2 bg-light border rounded">
                  <img
                    src={receiptUrl}
                    alt={`Nota Asli ${transaction.voucher_no || ''}`}
                    className="img-fluid rounded border shadow-sm"
                    style={{
                      maxHeight: '480px',
                      maxWidth: '100%',
                      objectFit: 'contain',
                      background: '#ffffff',
                    }}
                  />
                  <div className="small text-muted mt-2 fst-italic">
                    Foto fisik nota belanja / bukti transfer asli yang diunggah
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CModalBody>

      <CModalFooter className="d-print-none justify-content-between">
        <div className="d-flex align-items-center gap-2">
          {receiptUrl && (
            <div className="form-check form-switch mb-0 small">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="includeReceiptSwitch"
                checked={includeReceipt}
                onChange={(e) => setIncludeReceipt(e.target.checked)}
              />
              <label
                className="form-check-label small cursor-pointer fw-semibold"
                htmlFor="includeReceiptSwitch"
              >
                Sertakan Gambar Nota Asli Saat Cetak
              </label>
            </div>
          )}
        </div>
        <div className="d-flex gap-2">
          <CButton color="secondary" variant="outline" onClick={onClose} disabled={downloading}>
            Tutup
          </CButton>
          <CButton
            color="success"
            className="text-white"
            onClick={() => handleDownloadPdf(false)}
            disabled={downloading}
          >
            {downloading ? (
              <CSpinner size="sm" className="me-1" />
            ) : (
              <CIcon icon={cilCloudDownload} className="me-1" />
            )}
            Unduh PDF
          </CButton>
          <CButton
            color="primary"
            onClick={() => handleDownloadPdf(true)}
            disabled={downloading}
          >
            {downloading ? (
              <CSpinner size="sm" className="me-1" />
            ) : (
              <CIcon icon={cilPrint} className="me-1" />
            )}
            Cetak / Buka PDF
          </CButton>
        </div>
      </CModalFooter>
    </CModal>
  )
}

VoucherModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  transaction: PropTypes.object,
  type: PropTypes.oneOf(['expense', 'income']),
}

export default VoucherModal
