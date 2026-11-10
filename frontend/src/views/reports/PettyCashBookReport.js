import React, { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import {
  CCard,
  CCardBody,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CSpinner,
  CBadge,
  CButton,
  CFormSelect,
  CFormInput,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react'
import { CIcon } from '@coreui/icons-react'
import {
  cilPrint,
  cilCloudDownload,
  cilReload,
  cilImage,
  cilDescription,
  cilFile,
  cilExternalLink,
} from '@coreui/icons'
import api from '../../services/api'
import { toastError } from '../../services/toastService'
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

const formatDateShort = (dateStr) => {
  if (!dateStr) return '-'
  const [year, month, day] = String(dateStr).substring(0, 10).split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
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

const PettyCashBookReport = () => {
  const company = useSelector((state) => state.company)

  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const defaultStartDate = `${year}-${month}-01`
  const lastDay = new Date(year, today.getMonth() + 1, 0).getDate()
  const defaultEndDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`

  const [accounts, setAccounts] = useState([])
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [startDate, setStartDate] = useState(defaultStartDate)
  const [endDate, setEndDate] = useState(defaultEndDate)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const [selectedVoucher, setSelectedVoucher] = useState(null)
  const [showVoucherModal, setShowVoucherModal] = useState(false)
  const [withReceipts, setWithReceipts] = useState(true)

  // Fetch accounts list once
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await api.get('/accounts', { params: { all: 1, is_active: 1 } })
        const list = res.data?.data || []
        setAccounts(list)
        const petty = list.find((a) => a.type === 'petty_cash') || list[0]
        if (petty) {
          setSelectedAccountId(String(petty.id))
        }
      } catch {
        setAccounts([])
      }
    }
    fetchAccounts()
  }, [])

  // Fetch statement data
  const fetchData = useCallback(async () => {
    if (!selectedAccountId) return
    setLoading(true)
    try {
      const res = await api.get('/reports/account-statement', {
        params: {
          account_id: selectedAccountId,
          start_date: startDate,
          end_date: endDate,
        },
      })
      setData(res.data?.data || null)
    } catch (err) {
      toastError(err.userMessage || 'Gagal memuat buku kas')
    } finally {
      setLoading(false)
    }
  }, [selectedAccountId, startDate, endDate])

  useEffect(() => {
    if (selectedAccountId) {
      fetchData()
    }
  }, [fetchData, selectedAccountId])

  // Download official server-side compiled PDF
  const handleDownloadPdf = async (stream = false) => {
    if (!selectedAccountId) return
    try {
      setDownloadingPdf(true)
      const res = await api.get('/reports/account-statement/pdf', {
        params: {
          account_id: selectedAccountId,
          start_date: startDate,
          end_date: endDate,
          with_receipts: withReceipts ? 1 : 0,
          download: stream ? 0 : 1,
        },
        responseType: 'blob',
      })

      const blob = new Blob([res.data], { type: 'application/pdf' })
      const blobUrl = window.URL.createObjectURL(blob)

      if (stream) {
        window.open(blobUrl, '_blank')
      } else {
        const link = document.createElement('a')
        link.href = blobUrl
        const cleanAccountName = (data?.account?.name || 'Kas').replace(/[^A-Za-z0-9_\-]/g, '_')
        const prefix = withReceipts ? 'Bundel_Lengkap_Buku_Kas' : 'Rekap_Buku_Kas'
        link.download = `${prefix}_${cleanAccountName}_${startDate}_sd_${endDate}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000)
    } catch (err) {
      toastError(err.userMessage || 'Gagal membuat file PDF buku kas')
    } finally {
      setDownloadingPdf(false)
    }
  }

  // Export to CSV / Excel
  const handleExportCSV = () => {
    if (!data || !data.transactions || data.transactions.length === 0) {
      toastError('Tidak ada data transaksi untuk diekspor.')
      return
    }

    const headers = [
      'No',
      'Tanggal',
      'No. Bukti / Voucher',
      'Tipe',
      'Kategori',
      'Keterangan',
      'Penerima / Sumber',
      'Masuk (Rp)',
      'Keluar (Rp)',
      'Saldo Berjalan (Rp)',
      'Bukti Fisik',
    ]

    const rows = data.transactions.map((t, idx) => [
      idx + 1,
      t.date,
      `"${t.voucher_no || '-'}"`,
      `"${t.type}"`,
      `"${t.category || '-'}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${(t.payee || '').replace(/"/g, '""')}"`,
      t.amount_in,
      t.amount_out,
      t.running_balance,
      t.attachment_url || t.attachment_path ? 'Ada' : '-',
    ])

    // Prepend Opening Balance Row
    rows.unshift([
      0,
      data.period.start_date,
      '-',
      'Saldo Awal',
      '-',
      'Saldo Awal Periode',
      '-',
      0,
      0,
      data.opening_balance,
      '-',
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `Buku_Kas_${data.account.name.replace(/\s+/g, '_')}_${startDate}_sd_${endDate}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div>
      <style>
        {`
          @page {
            size: A4 landscape;
            margin: 12mm 10mm;
          }
          @media print {
            html, body {
              background: #ffffff !important;
              color: #111827 !important;
              font-size: 11px !important;
              line-height: 1.3 !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
            }
            .sidebar,
            .header,
            .footer,
            .d-print-none,
            .nav,
            .modal-backdrop,
            .btn,
            button {
              display: none !important;
            }
            .wrapper,
            .body,
            .container-fluid,
            main {
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
            }
            .petty-cash-print-area {
              position: static !important;
              width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              background: transparent !important;
              color: #111827 !important;
            }
            .table-responsive {
              overflow: visible !important;
              display: block !important;
              width: 100% !important;
            }
            table.table {
              width: 100% !important;
              border-collapse: collapse !important;
              color: #111827 !important;
              font-size: 11px !important;
              margin-bottom: 0 !important;
            }
            table.table th,
            table.table td {
              padding: 6px 6px !important;
              border-color: #374151 !important;
              color: #111827 !important;
              vertical-align: middle !important;
            }
            thead {
              display: table-header-group !important;
            }
            tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            tbody tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .print-signature-block {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          }
        `}
      </style>

      {/* Control Bar: Account, Date Range, PDF & CSV Actions */}
      <CCard className="mb-4 shadow-sm border-0 bg-body-tertiary">
        <CCardBody className="p-3 p-md-4">
          <div className="row g-3 align-items-end">
            <div className="col-lg-4 col-md-12">
              <label className="form-label small fw-bold text-secondary mb-1">
                Pilih Akun Kas / Bank:
              </label>
              <CFormSelect
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                disabled={loading || downloadingPdf}
                className="fw-semibold"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type === 'petty_cash' ? 'Kas Kecil' : acc.type === 'bank' ? 'Bank' : 'Kas Tunai'})
                  </option>
                ))}
              </CFormSelect>
            </div>

            <div className="col-lg-3 col-sm-6">
              <label className="form-label small fw-bold text-secondary mb-1">Dari Tanggal:</label>
              <CFormInput
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={loading || downloadingPdf}
              />
            </div>

            <div className="col-lg-3 col-sm-6">
              <label className="form-label small fw-bold text-secondary mb-1">Sampai Tanggal:</label>
              <CFormInput
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={loading || downloadingPdf}
              />
            </div>

            <div className="col-lg-2 col-md-12 d-flex gap-2">
              <CButton
                color="secondary"
                variant="outline"
                className="w-100 d-flex align-items-center justify-content-center gap-1"
                onClick={fetchData}
                disabled={loading || downloadingPdf}
                title="Muat Ulang Data"
              >
                <CIcon icon={cilReload} />
                <span className="small fw-semibold">Refresh</span>
              </CButton>
            </div>
          </div>

          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mt-3 pt-3 border-top">
            <div className="d-flex flex-wrap align-items-center gap-3">
              <div className="form-check form-switch mb-0">
                <input
                  className="form-check-input cursor-pointer"
                  type="checkbox"
                  role="switch"
                  id="withReceiptsSwitch"
                  checked={withReceipts}
                  onChange={(e) => setWithReceipts(e.target.checked)}
                />
                <label
                  className="form-check-label small fw-semibold cursor-pointer d-flex align-items-center gap-1"
                  htmlFor="withReceiptsSwitch"
                >
                  <span>Lampirkan Berkas Bukti Fisik di PDF</span>
                  {(data?.transactions || []).filter((t) => Boolean(t.attachment_url || t.attachment_path)).length > 0 && (
                    <span className="badge bg-primary text-white ms-1">
                      {(data?.transactions || []).filter((t) => Boolean(t.attachment_url || t.attachment_path)).length} Berkas
                    </span>
                  )}
                </label>
              </div>
            </div>

            <div className="d-flex flex-wrap align-items-center gap-2">
              <CButton
                color="primary"
                className="btn-sm d-flex align-items-center gap-1 px-3 py-2 fw-semibold"
                onClick={() => handleDownloadPdf(true)}
                disabled={loading || downloadingPdf || !data}
                title="Buka / Cetak PDF di Tab Baru (Tersedia tombol Cetak & Unduh langsung di viewer)"
              >
                {downloadingPdf ? (
                  <CSpinner size="sm" className="me-1" />
                ) : (
                  <CIcon icon={cilPrint} />
                )}
                <span>Cetak / Unduh PDF</span>
              </CButton>

              <CButton
                color="secondary"
                variant="outline"
                className="btn-sm d-flex align-items-center gap-1 px-3 py-2"
                onClick={handleExportCSV}
                disabled={loading || downloadingPdf || !data}
                title="Download Spreadsheet CSV"
              >
                <CIcon icon={cilFile} />
                <span>CSV</span>
              </CButton>
            </div>
          </div>
        </CCardBody>
      </CCard>

      {/* Main Ledger Content */}
      <div className="petty-cash-content">
        {/* Header Title (Tanpa Kop Surat) */}
        <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
          <div>
            <h5 className="fw-bold mb-0 text-uppercase">
              BUKU KAS KECIL &amp; MUTASI KAS
            </h5>
            <div className="text-muted small">
              Laporan Pertanggungjawaban Mutasi Kas Operasional &bull; Castra Petty Cash
            </div>
          </div>
          <div className="text-end">
            <h6 className="fw-bold mb-0 text-primary">{data?.account?.name || 'Kas Kecil'}</h6>
            <div className="text-muted small">
              Periode: {formatDateShort(startDate)} s/d {formatDateShort(endDate)}
            </div>
          </div>
        </div>

        {/* 4 Executive Summary Cards */}
        {data && (
          <div className="row g-2 mb-4">
            <div className="col-md-3 col-6">
              <div className="p-3 rounded bg-body border shadow-sm h-100">
                <span className="text-secondary text-uppercase fw-semibold small d-block mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                  Saldo Awal
                </span>
                <h5 className="fw-bold mb-0 text-body">
                  {formatCurrency(data.opening_balance)}
                </h5>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="p-3 rounded bg-body border shadow-sm h-100">
                <span className="text-secondary text-uppercase fw-semibold small d-block mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                  Total Masuk (Debet)
                </span>
                <h5 className="fw-bold mb-0 text-success">
                  +{formatCurrency(data.total_in)}
                </h5>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="p-3 rounded bg-body border shadow-sm h-100">
                <span className="text-secondary text-uppercase fw-semibold small d-block mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                  Total Keluar (Kredit)
                </span>
                <h5 className="fw-bold mb-0 text-danger">
                  -{formatCurrency(data.total_out)}
                </h5>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="p-3 rounded bg-body border shadow-sm h-100">
                <span className="text-secondary text-uppercase fw-semibold small d-block mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                  Saldo Akhir
                </span>
                <h5 className="fw-bold mb-0 text-primary">
                  {formatCurrency(data.closing_balance)}
                </h5>
              </div>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="text-center py-5">
            <CSpinner color="primary" />
            <div className="mt-2 text-body-secondary">Memuat mutasi buku kas...</div>
          </div>
        )}

        {/* Ledger Table */}
        {!loading && data && (
          <CCard className="shadow-sm mb-4">
            <CCardBody className="p-0">
              <CTable hover responsive align="middle" className="mb-0 border">
                <CTableHead className="bg-body-secondary border-bottom">
                  <CTableRow>
                    <CTableHeaderCell style={{ width: '4%' }}>No</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: '10%' }}>Tanggal</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: '13%' }}>No. Bukti</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: '13%' }}>Pos / Kategori</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: '24%' }}>
                      Keterangan & Penerima
                    </CTableHeaderCell>
                    <CTableHeaderCell
                      style={{ width: '12%' }}
                      className="text-end text-success text-nowrap"
                    >
                      Masuk (Rp)
                    </CTableHeaderCell>
                    <CTableHeaderCell
                      style={{ width: '12%' }}
                      className="text-end text-danger text-nowrap"
                    >
                      Keluar (Rp)
                    </CTableHeaderCell>
                    <CTableHeaderCell style={{ width: '12%' }} className="text-end text-nowrap">
                      Saldo (Rp)
                    </CTableHeaderCell>
                    <CTableHeaderCell style={{ width: '6%' }} className="text-center">
                      Nota
                    </CTableHeaderCell>
                    <CTableHeaderCell width={50} className="text-center d-print-none">
                      Aksi
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {/* Saldo Awal Row */}
                  <CTableRow className="bg-body-tertiary fw-bold">
                    <CTableDataCell className="text-center">&bull;</CTableDataCell>
                    <CTableDataCell>{formatDateShort(data.period.start_date)}</CTableDataCell>
                    <CTableDataCell className="text-muted font-monospace">-</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color="secondary">Saldo Awal</CBadge>
                    </CTableDataCell>
                    <CTableDataCell>Saldo kas awal periode</CTableDataCell>
                    <CTableDataCell className="text-end">-</CTableDataCell>
                    <CTableDataCell className="text-end">-</CTableDataCell>
                    <CTableDataCell className="text-end text-body fw-bold text-nowrap">
                      {formatCurrency(data.opening_balance)}
                    </CTableDataCell>
                    <CTableDataCell className="text-center text-muted small">-</CTableDataCell>
                    <CTableDataCell className="d-print-none text-center text-muted small">
                      -
                    </CTableDataCell>
                  </CTableRow>

                  {/* Transaction Rows */}
                  {data.transactions.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={10} className="text-center py-4 text-muted">
                        Tidak ada transaksi mutasi kas pada rentang tanggal ini.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    data.transactions.map((tx, idx) => (
                      <CTableRow key={`${tx.source_type}-${tx.id}`}>
                        <CTableDataCell className="text-center text-muted small">
                          {idx + 1}
                        </CTableDataCell>
                        <CTableDataCell className="small">
                          {formatDateShort(tx.date)}
                        </CTableDataCell>
                        <CTableDataCell>
                          <span className="font-monospace small fw-semibold text-secondary">
                            {tx.voucher_no || '-'}
                          </span>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge
                            color={
                              tx.source_type === 'income'
                                ? 'success'
                                : tx.source_type === 'expense'
                                  ? 'danger'
                                  : 'info'
                            }
                            className="small"
                          >
                            {tx.category}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="fw-semibold text-body small">{tx.description}</div>
                          {tx.payee && tx.payee !== '-' && (
                            <div className="text-muted small">Pihak: {tx.payee}</div>
                          )}
                        </CTableDataCell>
                        <CTableDataCell className="text-end text-success fw-bold small text-nowrap">
                          {tx.amount_in > 0 ? `+${formatCurrency(tx.amount_in)}` : '-'}
                        </CTableDataCell>
                        <CTableDataCell className="text-end text-danger fw-bold small text-nowrap">
                          {tx.amount_out > 0 ? `-${formatCurrency(tx.amount_out)}` : '-'}
                        </CTableDataCell>
                        <CTableDataCell className="text-end fw-bold text-body small text-nowrap">
                          {formatCurrency(tx.running_balance)}
                        </CTableDataCell>
                        <CTableDataCell className="text-center">
                          {tx.attachment_url || tx.attachment_path ? (
                            <CButton
                              size="sm"
                              color="primary"
                              variant="ghost"
                              className="p-1 text-primary"
                              title="Lihat Bukti Struk / Nota Fisik"
                              onClick={() =>
                                setPreviewImage(
                                  tx.attachment_url || `/storage/${tx.attachment_path}`,
                                )
                              }
                            >
                              <CIcon icon={cilImage} size="lg" />
                            </CButton>
                          ) : (
                            <span className="text-muted small">-</span>
                          )}
                        </CTableDataCell>
                        <CTableDataCell className="d-print-none text-center">
                          <div className="d-flex align-items-center justify-content-center gap-1">
                            {tx.voucher_no &&
                              (tx.source_type === 'expense' || tx.source_type === 'income') && (
                                <CButton
                                  size="sm"
                                  color="light"
                                  variant="ghost"
                                  className="p-1 text-primary"
                                  title="Cetak Lembar Voucher"
                                  onClick={() => {
                                    setSelectedVoucher({
                                      voucher_no: tx.voucher_no,
                                      transaction_date: tx.date,
                                      amount: tx.amount_in || tx.amount_out,
                                      payee: tx.payee,
                                      category: { name: tx.category },
                                      account: data.account,
                                      notes: tx.description,
                                      attachment_url: tx.attachment_url,
                                      attachment_path: tx.attachment_path,
                                    })
                                    setShowVoucherModal(true)
                                  }}
                                >
                                  <CIcon icon={cilDescription} />
                                </CButton>
                              )}
                          </div>
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}

                  {/* Summary Footer Row */}
                  <CTableRow className="bg-body-tertiary fw-bold border-top">
                    <CTableDataCell colSpan={5} className="text-end text-uppercase">
                      Total Mutasi &amp; Saldo Akhir:
                    </CTableDataCell>
                    <CTableDataCell className="text-end text-success fw-bold text-nowrap">
                      +{formatCurrency(data.total_in)}
                    </CTableDataCell>
                    <CTableDataCell className="text-end text-danger fw-bold text-nowrap">
                      -{formatCurrency(data.total_out)}
                    </CTableDataCell>
                    <CTableDataCell className="text-end text-primary fw-bold text-nowrap">
                      {formatCurrency(data.closing_balance)}
                    </CTableDataCell>
                    <CTableDataCell className="text-center text-muted small">-</CTableDataCell>
                    <CTableDataCell className="d-print-none"></CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        )}

        {/* Print Sign-Off Footer */}
        <div className="d-none d-print-block mt-4 pt-3 print-signature-block">
          <div className="row text-center">
            <div className="col-4">
              <div className="small text-muted mb-1">Dibuat Oleh (Kasir Kas Kecil):</div>
              <div
                className="border-bottom border-dark mx-auto"
                style={{ height: '70px', width: '80%' }}
              ></div>
              <div className="small fw-bold mt-1">( Pengelola Kas )</div>
            </div>
            <div className="col-4">
              <div className="small text-muted mb-1">
                Diperiksa Oleh (Internal Auditor / Akuntan):
              </div>
              <div
                className="border-bottom border-dark mx-auto"
                style={{ height: '70px', width: '80%' }}
              ></div>
              <div className="small fw-bold mt-1">( Verifikator )</div>
            </div>
            <div className="col-4">
              <div className="small text-muted mb-1">
                Disetujui Oleh (Pimpinan / Finance Manager):
              </div>
              <div
                className="border-bottom border-dark mx-auto"
                style={{ height: '70px', width: '80%' }}
              ></div>
              <div className="small fw-bold mt-1">( Manajer Keuangan )</div>
            </div>
          </div>
          <div className="text-center text-muted small mt-4">
            Dokumen ini dicetak otomatis dari sistem Castra pada {formatDateLong(new Date())}
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Attachment */}
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
                title="Bukti Dokumen"
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
        type={selectedVoucher?.voucher_no?.startsWith('BKK') ? 'expense' : 'income'}
      />
    </div>
  )
}

PettyCashBookReport.propTypes = {
  account: PropTypes.object,
}

export default PettyCashBookReport
