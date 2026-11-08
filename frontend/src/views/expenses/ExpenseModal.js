import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CForm,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CInputGroup,
  CInputGroupText,
  CSpinner,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
} from '@coreui/react'
import { CIcon } from '@coreui/icons-react'
import {
  cilPencil,
  cilTrash,
  cilPlus,
  cilCloudUpload,
  cilCheckCircle,
  cilImage,
  cilReload,
  cilXCircle,
  cilInfo,
  cilCheck,
  cilPrint,
  cilPaperclip,
  cilCloudDownload,
} from '@coreui/icons'
import api from '../../services/api'
import { toastSuccess, toastError, toastWarning } from '../../services/toastService'
import { getFieldError } from '../../utils/formErrors'
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

const formatDateIndonesian = (dateStr) => {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const emptyForm = {
  account_id: '',
  category_id: '',
  amount: '',
  payee: '',
  voucher_no: '',
  notes: '',
  status: 'approved',
  currency: 'IDR',
  transaction_date: '',
  attachment_path: '',
}

const emptyOcrFlags = {
  amount: false,
  transaction_date: false,
  payee: false,
  notes: false,
  category_id: false,
}

const ExpenseModal = ({
  visible,
  onClose,
  selectedDate,
  dailyItems = [],
  categories = [],
  onSaved,
}) => {
  const [form, setForm] = useState(emptyForm)
  const [editingItem, setEditingItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [scannedReceipt, setScannedReceipt] = useState(null)
  const [receiptImagePreview, setReceiptImagePreview] = useState(null)
  const [showImagePreviewModal, setShowImagePreviewModal] = useState(false)
  const [ocrAutoFilled, setOcrAutoFilled] = useState(emptyOcrFlags)
  const [deletingId, setDeletingId] = useState(null)
  const [errors, setErrors] = useState({})
  const [accounts, setAccounts] = useState([])
  const [voucherItem, setVoucherItem] = useState(null)
  const [showVoucherModal, setShowVoucherModal] = useState(false)
  const [isSplitMode, setIsSplitMode] = useState(false)
  const [splits, setSplits] = useState([
    { category_id: '', amount: '', notes: '' },
    { category_id: '', amount: '', notes: '' },
  ])
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const directFileInputRef = useRef(null)

  const handleApprove = async (id) => {
    setActionLoadingId(id)
    try {
      await api.post(`/expenses/${id}/approve`)
      toastSuccess('Voucher pengeluaran disetujui (Approved)')
      onSaved?.()
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
      toastSuccess('Voucher pengeluaran ditolak')
      onSaved?.()
    } catch (err) {
      toastError(err.userMessage || 'Gagal menolak voucher')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleAddSplit = () => {
    setSplits((prev) => [...prev, { category_id: '', amount: '', notes: '' }])
  }

  const handleRemoveSplit = (idx) => {
    setSplits((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSplitChange = (idx, field, value) => {
    setSplits((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
  }

  const fileInputRef = useRef(null)

  // Reset modal state on open/close and fetch accounts
  useEffect(() => {
    if (visible) {
      setForm({
        ...emptyForm,
        transaction_date: selectedDate || '',
      })
      setEditingItem(null)
      setScannedReceipt(null)
      setReceiptImagePreview(null)
      setShowImagePreviewModal(false)
      setOcrAutoFilled(emptyOcrFlags)
      setErrors({})

      api
        .get('/accounts', { params: { all: 1, is_active: 1 } })
        .then((res) => {
          const accList = res.data?.data || []
          setAccounts(accList)
          const petty = accList.find((a) => a.type === 'petty_cash') || accList[0]
          if (petty) {
            setForm((prev) => ({
              ...prev,
              account_id: prev.account_id || String(petty.id),
            }))
          }
        })
        .catch(() => {})
    }
  }, [visible, selectedDate])

  // Cleanup object URL on unmount or receipt reset
  useEffect(() => {
    return () => {
      if (receiptImagePreview && receiptImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(receiptImagePreview)
      }
    }
  }, [receiptImagePreview])

  // Process receipt file with OCR
  const processReceiptFile = useCallback(
    async (file) => {
      if (!file) return

      if (!file.type.startsWith('image/')) {
        toastError('Format file harus berupa gambar (JPG, PNG, atau WEBP).')
        return
      }

      // Max size: 10MB
      if (file.size > 10 * 1024 * 1024) {
        toastError('Ukuran gambar maksimal adalah 10MB.')
        return
      }

      // Create preview URL
      if (receiptImagePreview && receiptImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(receiptImagePreview)
      }
      const previewUrl = URL.createObjectURL(file)
      setReceiptImagePreview(previewUrl)

      setScanning(true)
      const formData = new FormData()
      formData.append('receipt', file)

      try {
        const res = await api.post('/expenses/scan-receipt', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        const data = res.data?.data || {}

        const newOcrFlags = {
          amount: data.amount != null,
          transaction_date: Boolean(data.transaction_date),
          payee: Boolean(data.payee || data.merchant),
          notes: Boolean(data.notes),
          category_id: Boolean(data.suggested_category_id),
        }

        setForm((prev) => ({
          ...prev,
          amount: data.amount != null ? String(data.amount) : prev.amount,
          transaction_date: data.transaction_date || prev.transaction_date,
          payee: data.payee || data.merchant || prev.payee,
          notes: data.notes || prev.notes,
          category_id: data.suggested_category_id
            ? String(data.suggested_category_id)
            : prev.category_id,
          attachment_path: data.attachment_path || prev.attachment_path,
        }))

        setOcrAutoFilled(newOcrFlags)

        setScannedReceipt({
          merchant: data.payee || data.merchant || 'Struk Belanja',
          amount: data.amount,
          transaction_date: data.transaction_date,
          suggested_category_name: data.suggested_category_name,
          fileName: file.name,
          attachment_url: data.attachment_url,
        })

        if (data.amount) {
          toastSuccess(
            `Nota berhasil dibaca: ${data.merchant || 'Struk'} (${formatCurrency(data.amount)})`,
          )
        } else {
          toastWarning(
            'Nota terbaca, namun total harga tidak terdeteksi otomatis. Silakan periksa atau isi nominal secara manual.',
          )
        }
      } catch (err) {
        toastError(
          err.userMessage || 'Gagal membaca nota. Silakan isi form pengeluaran secara manual.',
        )
      } finally {
        setScanning(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    },
    [receiptImagePreview],
  )

  const handleDirectFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf'
    const isImage = file.type.startsWith('image/')

    if (!isImage && !isPdf) {
      toastError('Format file harus berupa gambar (JPG, PNG, WEBP) atau dokumen PDF.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toastError('Ukuran file maksimal adalah 10MB.')
      return
    }

    setUploadingReceipt(true)
    const formData = new FormData()
    formData.append('receipt', file)

    try {
      const res = await api.post('/expenses/upload-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const data = res.data?.data || {}
      setForm((prev) => ({
        ...prev,
        attachment_path: data.attachment_path,
      }))
      setReceiptImagePreview(data.attachment_url)
      toastSuccess(`Bukti transaksi "${file.name}" berhasil diunggah!`)
    } catch (err) {
      toastError(err.userMessage || 'Gagal mengunggah bukti transaksi.')
    } finally {
      setUploadingReceipt(false)
      if (directFileInputRef.current) directFileInputRef.current.value = ''
    }
  }

  // Listen to paste event (Ctrl+V) when modal is open
  useEffect(() => {
    if (!visible || editingItem || scanning) return

    const handlePaste = (e) => {
      // Ignore if typing inside text fields
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile()
          if (file) {
            processReceiptFile(file)
            break
          }
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [visible, editingItem, scanning, processReceiptFile])

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragging) setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) {
      processReceiptFile(file)
    }
  }

  const handleClearScannedReceipt = () => {
    if (receiptImagePreview && receiptImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(receiptImagePreview)
    }
    setScannedReceipt(null)
    setReceiptImagePreview(null)
    setOcrAutoFilled(emptyOcrFlags)
  }

  const handleEditClick = (item) => {
    setEditingItem(item)
    handleClearScannedReceipt()
    setForm({
      account_id: item.account_id ? String(item.account_id) : '',
      transaction_date: item.transaction_date || selectedDate,
      category_id: item.category_id || '',
      amount: item.amount != null ? String(item.amount) : '',
      payee: item.payee || '',
      voucher_no: item.voucher_no || '',
      notes: item.notes || '',
      attachment_path: item.attachment_path || '',
    })
    if (item.attachment_url) {
      setReceiptImagePreview(item.attachment_url)
    }
    setErrors({})
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
    handleClearScannedReceipt()
    setForm({
      ...emptyForm,
      transaction_date: selectedDate || '',
    })
    setErrors({})
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setErrors((prev) => ({ ...prev, [name]: null }))
    // If user edits a field, clear its auto-fill highlight badge
    setOcrAutoFilled((prev) => ({ ...prev, [name]: false }))
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})

    const parseAmount = (val) =>
      typeof val === 'string' ? Number(val.replace(',', '.')) : Number(val)

    const payload = {
      account_id: form.account_id ? Number(form.account_id) : null,
      transaction_date: form.transaction_date,
      category_id: Number(form.category_id),
      amount: parseAmount(form.amount),
      status: form.status || 'approved',
      payee: form.payee ? form.payee.trim() : null,
      voucher_no: form.voucher_no ? form.voucher_no.trim() : null,
      notes: form.notes ? form.notes.trim() : null,
      attachment_path: form.attachment_path || null,
    }

    if (isSplitMode && splits.length > 1) {
      const validSplits = splits.filter((s) => s.category_id && s.amount)
      if (validSplits.length > 1) {
        payload.splits = validSplits.map((s) => ({
          category_id: Number(s.category_id),
          amount: parseAmount(s.amount),
          notes: s.notes ? s.notes.trim() : null,
        }))
      }
    }

    try {
      if (editingItem) {
        await api.put(`/expenses/${editingItem.id}`, payload)
        toastSuccess('Transaksi pengeluaran berhasil diperbarui')
      } else {
        await api.post('/expenses', payload)
        toastSuccess('Transaksi pengeluaran berhasil dicatat')
      }

      setEditingItem(null)
      handleClearScannedReceipt()
      setForm({
        ...emptyForm,
        transaction_date: selectedDate || '',
      })
      onSaved()
    } catch (err) {
      setErrors(err.validationErrors || {})
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus transaksi pengeluaran ini?')) return

    setDeletingId(id)
    try {
      await api.delete(`/expenses/${id}`)
      toastSuccess('Transaksi pengeluaran berhasil dihapus')
      if (editingItem?.id === id) {
        handleCancelEdit()
      }
      onSaved()
    } catch (err) {
      toastError(err.userMessage || 'Gagal menghapus transaksi')
    } finally {
      setDeletingId(null)
    }
  }

  const totalDaily = dailyItems.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)

  return (
    <>
      <CModal size="lg" visible={visible} onClose={onClose} backdrop="static">
        <CModalHeader closeButton>
          <CModalTitle>
            Pengeluaran: {formatDateIndonesian(selectedDate)}
            {totalDaily > 0 && (
              <CBadge color="danger" className="ms-2 fs-6">
                Total: {formatCurrency(totalDaily)}
              </CBadge>
            )}
          </CModalTitle>
        </CModalHeader>

        <CModalBody>
          {/* Riwayat transaksi pada tanggal ini */}
          {dailyItems.length > 0 && (
            <div className="mb-4">
              <h6 className="fw-bold mb-2">Riwayat Pengeluaran Hari Ini ({dailyItems.length})</h6>
              <CTable hover responsive small className="border">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>No. Bukti / Kategori</CTableHeaderCell>
                    <CTableHeaderCell>Akun Kas</CTableHeaderCell>
                    <CTableHeaderCell>Kelompok</CTableHeaderCell>
                    <CTableHeaderCell>Penerima & Catatan</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell>Nominal</CTableHeaderCell>
                    <CTableHeaderCell width={70} className="text-center">
                      Nota
                    </CTableHeaderCell>
                    <CTableHeaderCell width={120}>Aksi</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {dailyItems.map((item) => (
                    <CTableRow
                      key={item.id}
                      className={editingItem?.id === item.id ? 'table-danger' : ''}
                    >
                      <CTableDataCell>
                        {item.voucher_no && (
                          <div className="small font-monospace text-secondary mb-1">
                            {item.voucher_no}
                          </div>
                        )}
                        <strong>{item.category?.name || '-'}</strong>
                      </CTableDataCell>
                      <CTableDataCell>
                        {item.account ? (
                          <CBadge
                            color={item.account.type === 'petty_cash' ? 'warning' : 'secondary'}
                          >
                            {item.account.name}
                          </CBadge>
                        ) : (
                          <span className="text-body-secondary small">-</span>
                        )}
                      </CTableDataCell>
                      <CTableDataCell>
                        {item.category?.budget_group ? (
                          <CBadge color="info">
                            {item.category.budget_group.name} (
                            {item.category.budget_group.percentage}%)
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
                        {formatCurrency(item.amount)}
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        {item.attachment_url ? (
                          <CButton
                            size="sm"
                            color="info"
                            variant="ghost"
                            className="p-1 text-info"
                            title="Lihat Bukti Nota"
                            onClick={() => {
                              setReceiptImagePreview(item.attachment_url)
                              setShowImagePreviewModal(true)
                            }}
                          >
                            <CIcon icon={cilImage} size="lg" />
                          </CButton>
                        ) : (
                          <span className="text-body-secondary small">-</span>
                        )}
                      </CTableDataCell>
                      <CTableDataCell>
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
                          onClick={() => {
                            setVoucherItem(item)
                            setShowVoucherModal(true)
                          }}
                          className="p-1 me-1 text-primary"
                        >
                          <CIcon icon={cilPrint} />
                        </CButton>
                        <CButton
                          size="sm"
                          color="secondary"
                          variant="ghost"
                          title="Edit"
                          onClick={() => handleEditClick(item)}
                          className="p-1 me-1"
                          disabled={saving || deletingId === item.id}
                        >
                          <CIcon icon={cilPencil} />
                        </CButton>
                        <CButton
                          size="sm"
                          color="danger"
                          variant="ghost"
                          title="Hapus"
                          onClick={() => handleDelete(item.id)}
                          className="p-1"
                          disabled={saving || deletingId === item.id}
                        >
                          {deletingId === item.id ? (
                            <CSpinner size="sm" />
                          ) : (
                            <CIcon icon={cilTrash} />
                          )}
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </div>
          )}

          {/* Formulir Input / Edit */}
          <div className="border rounded p-3 bg-body-tertiary">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">
                {editingItem ? 'Edit Transaksi Pengeluaran' : 'Catat Pengeluaran Baru'}
              </h6>
              {editingItem && (
                <CButton size="sm" color="outline-secondary" onClick={handleCancelEdit}>
                  <CIcon icon={cilPlus} className="me-1" />
                  Catat Baru
                </CButton>
              )}
            </div>

            {/* Fitur OCR Scan Nota / Struk Belanja Modern */}
            {!editingItem && (
              <div className="mb-4">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  className="d-none"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) processReceiptFile(f)
                  }}
                  disabled={scanning || saving}
                />

                {scanning ? (
                  /* Loading State */
                  <div className="receipt-drop-zone text-center">
                    <CSpinner size="sm" color="primary" className="mb-2" />
                    <div className="small fw-semibold text-body">
                      Membaca nota dengan Tesseract OCR...
                    </div>
                    <div className="receipt-drop-hint">
                      Sedang mendeteksi total harga, tanggal, dan nama toko
                    </div>
                  </div>
                ) : scannedReceipt ? (
                  /* Scanned Result Card with Thumbnail & Metadata */
                  <div className="p-3 rounded border bg-body">
                    <div className="d-flex flex-column flex-sm-row gap-3 align-items-start align-items-sm-center justify-content-between">
                      {/* Left: Thumbnail & Details */}
                      <div className="d-flex gap-3 align-items-center flex-grow-1">
                        {receiptImagePreview && (
                          <div
                            role="button"
                            tabIndex={0}
                            title="Klik untuk melihat foto penuh"
                            onClick={() => setShowImagePreviewModal(true)}
                            onKeyDown={(e) => e.key === 'Enter' && setShowImagePreviewModal(true)}
                            className="position-relative rounded overflow-hidden border flex-shrink-0 cursor-pointer"
                            style={{ width: '52px', height: '52px' }}
                          >
                            <img
                              src={receiptImagePreview}
                              alt="Thumbnail Nota"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div
                              className="position-absolute bottom-0 start-0 end-0 text-center bg-dark bg-opacity-75 text-white"
                              style={{ fontSize: '9px', lineHeight: '14px' }}
                            >
                              Lihat
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                            <CBadge color="success" className="py-1">
                              <CIcon icon={cilCheckCircle} className="me-1" />
                              Pindai Berhasil
                            </CBadge>
                            <span className="fw-bold text-body">{scannedReceipt.merchant}</span>
                          </div>

                          <div className="text-body-secondary small d-flex flex-wrap gap-2 align-items-center">
                            <span>
                              Total:{' '}
                              <strong className="text-danger">
                                {scannedReceipt.amount
                                  ? formatCurrency(scannedReceipt.amount)
                                  : 'Tidak terdeteksi'}
                              </strong>
                            </span>
                            {scannedReceipt.suggested_category_name && (
                              <span>
                                &bull; Kategori:{' '}
                                <strong className="text-primary">
                                  {scannedReceipt.suggested_category_name}
                                </strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="d-flex gap-2 flex-shrink-0 align-self-end align-self-sm-center">
                        <CButton
                          size="sm"
                          color="secondary"
                          variant="ghost"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={saving}
                          title="Ganti file nota"
                        >
                          <CIcon icon={cilReload} className="me-1" />
                          Ganti
                        </CButton>
                        <CButton
                          size="sm"
                          color="danger"
                          variant="ghost"
                          onClick={handleClearScannedReceipt}
                          disabled={saving}
                          title="Hapus hasil pindaian nota"
                        >
                          <CIcon icon={cilXCircle} className="me-1" />
                          Reset
                        </CButton>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Clean Dropzone: Pindai Otomatis */
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`receipt-drop-zone ${isDragging ? 'is-dragging' : ''}`}
                    onClick={(e) => {
                      if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
                        fileInputRef.current?.click()
                      }
                    }}
                  >
                    <div className="mb-2">
                      <CIcon
                        icon={cilCloudUpload}
                        size="xl"
                        className="text-secondary opacity-75"
                      />
                    </div>
                    <div className="mb-2">
                      <CButton
                        size="sm"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation()
                          fileInputRef.current?.click()
                        }}
                        disabled={saving}
                      >
                        <CIcon icon={cilCloudUpload} className="me-1" />
                        Unggah Nota
                      </CButton>
                    </div>
                    <div className="receipt-drop-hint">
                      Tarik &amp; lepas file nota ke sini, atau tekan <kbd>Ctrl + V</kbd> untuk
                      menempelkan gambar
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Input Form Fields */}
            <CForm onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* Account / Sumber Kas */}
                <div className="col-md-6">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <label className="form-label mb-0 fw-semibold small">
                      Sumber Kas / Rekening *
                    </label>
                  </div>
                  <CFormSelect
                    name="account_id"
                    value={form.account_id}
                    onChange={handleChange}
                    invalid={Boolean(getFieldError(errors, 'account_id'))}
                    feedbackInvalid={getFieldError(errors, 'account_id')}
                    disabled={saving}
                  >
                    <option value="">-- Pilih Akun Kas --</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (
                        {acc.type === 'petty_cash'
                          ? 'Kas Kecil'
                          : acc.type === 'bank'
                            ? 'Bank'
                            : 'Tunai'}
                        ) - Sisa: {formatCurrency(acc.current_balance)}
                      </option>
                    ))}
                  </CFormSelect>
                </div>

                {/* Category Input */}
                <div className="col-md-6">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <label className="form-label mb-0 fw-semibold small">
                      Kategori Pengeluaran *
                    </label>
                    {ocrAutoFilled.category_id && (
                      <span className="badge bg-success-subtle text-success border border-success-subtle py-0 px-2 small">
                        <CIcon icon={cilCheck} size="sm" className="me-1" />
                        Disarankan dari Nota
                      </span>
                    )}
                  </div>
                  <CFormSelect
                    name="category_id"
                    value={form.category_id}
                    onChange={handleChange}
                    invalid={Boolean(getFieldError(errors, 'category_id'))}
                    feedbackInvalid={getFieldError(errors, 'category_id')}
                    disabled={saving}
                  >
                    <option value="">-- Pilih Kategori Pengeluaran --</option>
                    {categories
                      .filter((c) => c.is_active || c.id === Number(form.category_id))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.budget_group ? `(${c.budget_group.name})` : ''}
                        </option>
                      ))}
                  </CFormSelect>
                </div>

                {/* Amount Input with Live Terbilang / Currency preview */}
                <div className="col-md-6">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <label className="form-label mb-0 fw-semibold small">Nominal (Rp) *</label>
                    {ocrAutoFilled.amount && (
                      <span className="badge bg-success-subtle text-success border border-success-subtle py-0 px-2 small">
                        <CIcon icon={cilCheck} size="sm" className="me-1" />
                        Terisi dari Total Nota
                      </span>
                    )}
                  </div>
                  <CInputGroup>
                    <CInputGroupText className="fw-bold text-secondary">
                      Rp
                    </CInputGroupText>
                    <CFormInput
                      type="number"
                      name="amount"
                      min="0.01"
                      step="any"
                      placeholder="0"
                      value={form.amount}
                      onChange={handleChange}
                      invalid={Boolean(getFieldError(errors, 'amount'))}
                      disabled={saving}
                    />
                  </CInputGroup>
                  {getFieldError(errors, 'amount') ? (
                    <div className="invalid-feedback d-block">
                      {getFieldError(errors, 'amount')}
                    </div>
                  ) : form.amount && !isNaN(Number(form.amount)) && Number(form.amount) > 0 ? (
                    <div className="form-text text-body-secondary mt-1">
                      Terbilang: <strong>{formatCurrency(form.amount)}</strong>
                    </div>
                  ) : null}
                </div>

                {/* Transaction Date */}
                <div className="col-md-6">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <label className="form-label mb-0 fw-semibold small">Tanggal Transaksi *</label>
                    {ocrAutoFilled.transaction_date && (
                      <span className="badge bg-success-subtle text-success border border-success-subtle py-0 px-2 small">
                        <CIcon icon={cilCheck} size="sm" className="me-1" />
                        Terisi dari Tanggal Nota
                      </span>
                    )}
                  </div>
                  <CFormInput
                    type="date"
                    name="transaction_date"
                    value={form.transaction_date}
                    onChange={handleChange}
                    invalid={Boolean(getFieldError(errors, 'transaction_date'))}
                    feedbackInvalid={getFieldError(errors, 'transaction_date')}
                    disabled={saving}
                  />
                </div>

                {/* Payee / Vendor Input */}
                <div className="col-md-6">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <label className="form-label mb-0 fw-semibold small">
                      Penerima / Toko / Vendor
                    </label>
                    {ocrAutoFilled.payee && (
                      <span className="badge bg-success-subtle text-success border border-success-subtle py-0 px-2 small">
                        <CIcon icon={cilCheck} size="sm" className="me-1" />
                        Terisi Nama Toko
                      </span>
                    )}
                  </div>
                  <CFormInput
                    type="text"
                    name="payee"
                    maxLength={150}
                    placeholder="Contoh: Pak Wahyu, SPBU Pertamina, Toko ATK..."
                    value={form.payee}
                    onChange={handleChange}
                    invalid={Boolean(getFieldError(errors, 'payee'))}
                    feedbackInvalid={getFieldError(errors, 'payee')}
                    disabled={saving}
                  />
                </div>

                {/* Voucher Number (BKK) */}
                <div className="col-md-6">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <label className="form-label mb-0 fw-semibold small">
                      No. Bukti Kas Keluar (BKK)
                    </label>
                    <span className="text-body-secondary small">(Opsional / Otomatis)</span>
                  </div>
                  <CFormInput
                    type="text"
                    name="voucher_no"
                    maxLength={50}
                    placeholder="Contoh: BKK-202611-0001"
                    value={form.voucher_no}
                    onChange={handleChange}
                    invalid={Boolean(getFieldError(errors, 'voucher_no'))}
                    feedbackInvalid={getFieldError(errors, 'voucher_no')}
                    disabled={saving}
                  />
                </div>

                {/* Notes Input */}
                <div className="col-md-6">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <label className="form-label mb-0 fw-semibold small">
                      Catatan / Keterangan
                    </label>
                    {ocrAutoFilled.notes && (
                      <span className="badge bg-success-subtle text-success border border-success-subtle py-0 px-2 small">
                        <CIcon icon={cilCheck} size="sm" className="me-1" />
                        Terisi dari Catatan
                      </span>
                    )}
                  </div>
                  <CFormTextarea
                    name="notes"
                    rows={2}
                    maxLength={500}
                    placeholder="Keterangan pengeluaran (contoh: Belanja ATK kantor, sarapan tim)..."
                    value={form.notes}
                    onChange={handleChange}
                    invalid={Boolean(getFieldError(errors, 'notes'))}
                    feedbackInvalid={getFieldError(errors, 'notes')}
                    disabled={saving}
                  />
                </div>

                {/* Status Pengajuan Voucher */}
                <div className="col-md-6">
                  <label className="form-label mb-1 fw-semibold small">
                    Status Pengajuan Voucher
                  </label>
                  <CFormSelect
                    name="status"
                    value={form.status || 'approved'}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="approved">Disetujui Langsung (Approved)</option>
                    <option value="submitted">Ajukan Persetujuan (Submit for Approval)</option>
                    <option value="draft">Simpan sebagai Draft</option>
                  </CFormSelect>
                </div>

                {/* Split Category Toggle & Detail */}
                {!editingItem && (
                  <div className="col-12 mt-2">
                    <div className="form-check form-switch p-2 bg-body-tertiary rounded border d-flex align-items-center gap-2">
                      <input
                        className="form-check-input ms-0"
                        type="checkbox"
                        role="switch"
                        id="splitCategorySwitch"
                        checked={isSplitMode}
                        onChange={(e) => setIsSplitMode(e.target.checked)}
                      />
                      <label
                        className="form-check-label fw-bold small mb-0"
                        htmlFor="splitCategorySwitch"
                      >
                        Pecah Kategori Pengeluaran (Split Category untuk 1 Nota Belanja)
                      </label>
                    </div>

                    {isSplitMode && (
                      <div className="p-3 border rounded bg-body-tertiary mt-2 shadow-sm">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="small fw-semibold text-secondary">
                            Rincian Alokasi Kategori Belanja Nota:
                          </span>
                          <CButton size="sm" color="outline-primary" onClick={handleAddSplit}>
                            + Tambah Alokasi Kategori
                          </CButton>
                        </div>
                        {splits.map((s, idx) => (
                          <div key={idx} className="row g-2 align-items-center mb-2">
                            <div className="col-md-5">
                              <CFormSelect
                                size="sm"
                                value={s.category_id}
                                onChange={(e) =>
                                  handleSplitChange(idx, 'category_id', e.target.value)
                                }
                              >
                                <option value="">-- Pilih Kategori --</option>
                                {categories.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                  </option>
                                ))}
                              </CFormSelect>
                            </div>
                            <div className="col-md-3">
                              <CFormInput
                                size="sm"
                                type="number"
                                placeholder="Nominal (Rp)"
                                value={s.amount}
                                onChange={(e) => handleSplitChange(idx, 'amount', e.target.value)}
                              />
                            </div>
                            <div className="col-md-3">
                              <CFormInput
                                size="sm"
                                type="text"
                                placeholder="Catatan item..."
                                value={s.notes}
                                onChange={(e) => handleSplitChange(idx, 'notes', e.target.value)}
                              />
                            </div>
                            <div className="col-md-1 text-center">
                              {splits.length > 1 && (
                                <CButton
                                  size="sm"
                                  color="danger"
                                  variant="ghost"
                                  className="p-1"
                                  onClick={() => handleRemoveSplit(idx)}
                                >
                                  &times;
                                </CButton>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Attachment / Bukti Nota Fisik Section */}
                <div className="col-12">
                  <label className="form-label small fw-semibold d-flex align-items-center gap-1 mb-1">
                    <CIcon icon={cilPaperclip} className="text-primary" />
                    Lampiran Bukti Transaksi / Nota Fisik (Opsional)
                  </label>
                  <input
                    type="file"
                    ref={directFileInputRef}
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    style={{ display: 'none' }}
                    onChange={handleDirectFileUpload}
                  />
                  {form.attachment_path ? (
                    <div className="d-flex align-items-center justify-content-between p-2 rounded border bg-success-subtle border-success-subtle">
                      <div className="d-flex align-items-center gap-2 small text-success-emphasis">
                        <CIcon icon={cilCheckCircle} />
                        <span>
                          Bukti nota fisik terlampir dan tersimpan di server.
                        </span>
                        {receiptImagePreview && (
                          <CButton
                            size="sm"
                            color="link"
                            className="p-0 text-success-emphasis fw-bold text-decoration-underline"
                            onClick={() => setShowImagePreviewModal(true)}
                          >
                            (Pratinjau)
                          </CButton>
                        )}
                      </div>
                      <div className="d-flex gap-2">
                        <CButton
                          size="sm"
                          color="secondary"
                          variant="outline"
                          className="py-0 px-2 small"
                          onClick={() => directFileInputRef.current?.click()}
                          disabled={uploadingReceipt || saving}
                        >
                          Ganti File
                        </CButton>
                        <CButton
                          size="sm"
                          color="link"
                          className="text-danger p-0 small text-decoration-none"
                          onClick={() => {
                            setForm((prev) => ({ ...prev, attachment_path: '' }))
                            setReceiptImagePreview(null)
                            handleClearScannedReceipt()
                          }}
                        >
                          Hapus Bukti
                        </CButton>
                      </div>
                    </div>
                  ) : (
                    <div className="d-flex align-items-center gap-2">
                      <CButton
                        size="sm"
                        color="secondary"
                        variant="outline"
                        onClick={() => directFileInputRef.current?.click()}
                        disabled={uploadingReceipt || saving}
                        className="d-inline-flex align-items-center gap-1"
                      >
                        <CIcon icon={cilCloudUpload} />
                        {uploadingReceipt ? 'Mengunggah...' : 'Unggah Bukti Nota / Invoice (JPG, PNG, PDF)'}
                      </CButton>
                      {uploadingReceipt && <CSpinner size="sm" />}
                      <span className="text-muted small">
                        Maks. 10MB
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Friendly Hint if OCR was used */}
              {scannedReceipt && (
                <div className="d-flex align-items-center gap-2 mt-3 p-2 bg-info-subtle border border-info-subtle rounded small text-info-emphasis">
                  <CIcon icon={cilInfo} className="flex-shrink-0" />
                  <span>
                    Data di atas diisi otomatis dari hasil baca nota. Anda tetap dapat mengedit atau
                    menyesuaikan nilai sebelum menyimpan.
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="d-flex justify-content-end gap-2 mt-4">
                {editingItem && (
                  <CButton
                    type="button"
                    color="secondary"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    Batal Edit
                  </CButton>
                )}
                <CButton type="submit" color="danger" className="text-white" disabled={saving}>
                  {saving ? (
                    <>
                      <CSpinner size="sm" className="me-2" />
                      Menyimpan...
                    </>
                  ) : editingItem ? (
                    'Simpan Perubahan'
                  ) : (
                    'Simpan Pengeluaran'
                  )}
                </CButton>
              </div>
            </CForm>
          </div>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" onClick={onClose} disabled={saving}>
            Tutup
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Lightbox Modal for Full Receipt Image Preview */}
      <CModal
        size="lg"
        visible={showImagePreviewModal}
        onClose={() => setShowImagePreviewModal(false)}
      >
        <CModalHeader closeButton>
          <CModalTitle className="d-flex align-items-center gap-2">
            <CIcon icon={cilImage} className="text-primary" />
            Pratinjau Foto Nota / Struk
          </CModalTitle>
        </CModalHeader>
        <CModalBody className="text-center p-3 bg-body-tertiary">
          {receiptImagePreview ? (
            receiptImagePreview.toLowerCase().includes('.pdf') ? (
              <iframe
                src={receiptImagePreview}
                title="Dokumen Bukti Nota"
                width="100%"
                height="500px"
                className="border rounded bg-white"
              />
            ) : (
              <img
                src={receiptImagePreview}
                alt="Foto Struk Penuh"
                className="img-fluid rounded shadow-sm border"
                style={{ maxHeight: '72vh', objectFit: 'contain' }}
              />
            )
          ) : (
            <p className="text-muted">Tidak ada foto nota untuk ditampilkan.</p>
          )}
        </CModalBody>
        <CModalFooter className="d-flex justify-content-between align-items-center">
          <div>
            {receiptImagePreview && (
              <a
                href={receiptImagePreview}
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
          <CButton color="secondary" onClick={() => setShowImagePreviewModal(false)}>
            Tutup Pratinjau
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Voucher Print Modal */}
      <VoucherModal
        visible={showVoucherModal}
        onClose={() => setShowVoucherModal(false)}
        transaction={voucherItem}
        type="expense"
      />
    </>
  )
}

export default ExpenseModal
