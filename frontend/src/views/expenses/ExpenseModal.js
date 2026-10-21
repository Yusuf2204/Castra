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
} from '@coreui/icons'
import api from '../../services/api'
import { toastSuccess, toastError, toastWarning } from '../../services/toastService'
import { getFieldError } from '../../utils/formErrors'

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
  category_id: '',
  amount: '',
  notes: '',
  transaction_date: '',
}

const emptyOcrFlags = {
  amount: false,
  transaction_date: false,
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

  const fileInputRef = useRef(null)

  // Reset modal state on open/close
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
          notes: Boolean(data.notes),
          category_id: Boolean(data.suggested_category_id),
        }

        setForm((prev) => ({
          ...prev,
          amount: data.amount != null ? String(data.amount) : prev.amount,
          transaction_date: data.transaction_date || prev.transaction_date,
          notes: data.notes || prev.notes,
          category_id: data.suggested_category_id
            ? String(data.suggested_category_id)
            : prev.category_id,
        }))

        setOcrAutoFilled(newOcrFlags)

        setScannedReceipt({
          merchant: data.merchant || 'Struk Belanja',
          amount: data.amount,
          transaction_date: data.transaction_date,
          suggested_category_name: data.suggested_category_name,
          fileName: file.name,
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
        toastError(err.userMessage || 'Gagal membaca nota. Silakan isi form pengeluaran secara manual.')
      } finally {
        setScanning(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    },
    [receiptImagePreview],
  )

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
      transaction_date: item.transaction_date || selectedDate,
      category_id: item.category_id || '',
      amount: item.amount != null ? String(item.amount) : '',
      notes: item.notes || '',
    })
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
      transaction_date: form.transaction_date,
      category_id: Number(form.category_id),
      amount: parseAmount(form.amount),
      notes: form.notes ? form.notes.trim() : null,
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
                    <CTableHeaderCell>Kategori</CTableHeaderCell>
                    <CTableHeaderCell>Kelompok</CTableHeaderCell>
                    <CTableHeaderCell>Nominal</CTableHeaderCell>
                    <CTableHeaderCell>Catatan</CTableHeaderCell>
                    <CTableHeaderCell width={80}>Aksi</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {dailyItems.map((item) => (
                    <CTableRow
                      key={item.id}
                      className={editingItem?.id === item.id ? 'table-danger' : ''}
                    >
                      <CTableDataCell>
                        <strong>{item.category?.name || '-'}</strong>
                      </CTableDataCell>
                      <CTableDataCell>
                        {item.category?.budget_group ? (
                          <CBadge color="info">
                            {item.category.budget_group.name} ({item.category.budget_group.percentage}
                            %)
                          </CBadge>
                        ) : (
                          <span className="text-body-secondary">-</span>
                        )}
                      </CTableDataCell>
                      <CTableDataCell className="text-danger fw-bold">
                        {formatCurrency(item.amount)}
                      </CTableDataCell>
                      <CTableDataCell>{item.notes || '-'}</CTableDataCell>
                      <CTableDataCell>
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
                    <div className="small fw-semibold text-body">Membaca nota dengan Tesseract OCR...</div>
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
                      <CIcon icon={cilCloudUpload} size="xl" className="text-secondary opacity-75" />
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
                      Tarik &amp; lepas file nota ke sini, atau tekan <kbd>Ctrl + V</kbd> untuk menempelkan gambar
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Input Form Fields */}
            <CForm onSubmit={handleSubmit}>
              <div className="row g-3">
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
                    <CInputGroupText className="bg-light fw-bold text-secondary">Rp</CInputGroupText>
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
                    <div className="invalid-feedback d-block">{getFieldError(errors, 'amount')}</div>
                  ) : form.amount && !isNaN(Number(form.amount)) && Number(form.amount) > 0 ? (
                    <div className="form-text text-body-secondary mt-1">
                      Terbilang: <strong>{formatCurrency(form.amount)}</strong>
                    </div>
                  ) : null}
                </div>

                {/* Transaction Date */}
                <div className="col-md-6">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <label className="form-label mb-0 fw-semibold small">
                      Tanggal Transaksi *
                    </label>
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

                {/* Notes Input */}
                <div className="col-md-6">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <label className="form-label mb-0 fw-semibold small">Catatan / Keterangan</label>
                    {ocrAutoFilled.notes && (
                      <span className="badge bg-success-subtle text-success border border-success-subtle py-0 px-2 small">
                        <CIcon icon={cilCheck} size="sm" className="me-1" />
                        Terisi Nama Toko
                      </span>
                    )}
                  </div>
                  <CFormTextarea
                    name="notes"
                    rows={2}
                    maxLength={500}
                    placeholder="Keterangan pengeluaran (contoh: Makan siang, belanja bulanan)..."
                    value={form.notes}
                    onChange={handleChange}
                    invalid={Boolean(getFieldError(errors, 'notes'))}
                    feedbackInvalid={getFieldError(errors, 'notes')}
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Friendly Hint if OCR was used */}
              {scannedReceipt && (
                <div className="d-flex align-items-center gap-2 mt-3 p-2 bg-info-subtle border border-info-subtle rounded small text-info-emphasis">
                  <CIcon icon={cilInfo} className="flex-shrink-0" />
                  <span>
                    Data di atas diisi otomatis dari hasil baca nota. Anda tetap dapat mengedit atau menyesuaikan nilai sebelum menyimpan.
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
        <CModalBody className="text-center p-3 bg-light">
          {receiptImagePreview ? (
            <img
              src={receiptImagePreview}
              alt="Foto Struk Penuh"
              className="img-fluid rounded shadow-sm border"
              style={{ maxHeight: '72vh', objectFit: 'contain' }}
            />
          ) : (
            <p className="text-muted">Tidak ada foto nota untuk ditampilkan.</p>
          )}
        </CModalBody>
        <CModalFooter className="d-flex justify-content-between">
          <span className="text-muted small">
            {scannedReceipt?.merchant ? `Toko: ${scannedReceipt.merchant}` : 'Nota Pengeluaran'}
          </span>
          <CButton color="secondary" onClick={() => setShowImagePreviewModal(false)}>
            Tutup Pratinjau
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default ExpenseModal
