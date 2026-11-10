import React, { useState, useEffect, useRef } from 'react'
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
} from '@coreui/react'
import { CIcon } from '@coreui/icons-react'
import { cilLoopCircular, cilPaperclip, cilXCircle, cilCloudUpload, cilCheckCircle, cilImage, cilDescription } from '@coreui/icons'
import api from '../../services/api'
import { toastSuccess, toastError } from '../../services/toastService'
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

const emptyForm = {
  from_account_id: '',
  to_account_id: '',
  amount: '',
  transfer_date: new Date().toISOString().substring(0, 10),
  reference_no: '',
  notes: '',
}

const FundTransferModal = ({ visible, onClose, onSaved }) => {
  const [form, setForm] = useState(emptyForm)
  const [accounts, setAccounts] = useState([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [attachmentFile, setAttachmentFile] = useState(null)
  const [attachmentPreview, setAttachmentPreview] = useState(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const handleProcessAttachment = (file) => {
    if (!file) return

    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf'
    const isImage = file.type.startsWith('image/')

    if (!isImage && !isPdf) {
      toastError('Format file harus berupa gambar (JPG, PNG, WEBP) atau dokumen PDF.')
      return
    }

    if (file.size > 25 * 1024 * 1024) {
      toastError('Ukuran file maksimal adalah 25MB.')
      return
    }

    setAttachmentFile(file)
    if (isImage) {
      if (attachmentPreview && attachmentPreview.startsWith('blob:')) {
        URL.revokeObjectURL(attachmentPreview)
      }
      setAttachmentPreview(URL.createObjectURL(file))
    } else {
      setAttachmentPreview(null)
    }
  }

  const handleRemoveAttachment = () => {
    if (attachmentPreview && attachmentPreview.startsWith('blob:')) {
      URL.revokeObjectURL(attachmentPreview)
    }
    setAttachmentFile(null)
    setAttachmentPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Fetch accounts on open
  useEffect(() => {
    if (visible) {
      setErrors({})
      handleRemoveAttachment()
      setForm({
        ...emptyForm,
        transfer_date: new Date().toISOString().substring(0, 10),
      })

      const loadAccounts = async () => {
        setLoadingAccounts(true)
        try {
          const res = await api.get('/accounts', { params: { all: 1, is_active: 1 } })
          const accList = res.data?.data || []
          setAccounts(accList)

          const bankAcc = accList.find((a) => a.type === 'bank') || accList[0]
          const pettyAcc = accList.find((a) => a.type === 'petty_cash')

          setForm((prev) => ({
            ...prev,
            from_account_id: bankAcc ? String(bankAcc.id) : '',
            to_account_id: pettyAcc ? String(pettyAcc.id) : '',
          }))
        } catch {
          toastError('Gagal memuat daftar akun kas.')
        } finally {
          setLoadingAccounts(false)
        }
      }

      loadAccounts()
    }
  }, [visible])

  // Paste (Ctrl+V) listener for clipboard screenshot or copied file
  useEffect(() => {
    if (!visible) return

    const handlePaste = (e) => {
      const files = e.clipboardData?.files
      const items = e.clipboardData?.items
      let file = null

      if (files && files.length > 0) {
        file = files[0]
      } else if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].kind === 'file') {
            file = items[i].getAsFile()
            if (file) break
          }
        }
      }

      if (file && (file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf')) {
        e.preventDefault()
        handleProcessAttachment(file)
        toastSuccess('Tangkapan layar / berkas dari clipboard berhasil ditempel!')
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [visible])

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
      handleProcessAttachment(file)
      toastSuccess(`Berkas "${file.name}" berhasil ditarik dan dilampirkan!`)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setErrors((prev) => ({ ...prev, [name]: null }))
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})

    const parseAmount = (val) =>
      typeof val === 'string' ? Number(val.replace(',', '.')) : Number(val)

    const formData = new FormData()
    formData.append('from_account_id', Number(form.from_account_id))
    formData.append('to_account_id', Number(form.to_account_id))
    formData.append('amount', parseAmount(form.amount))
    formData.append('transfer_date', form.transfer_date)
    if (form.reference_no) formData.append('reference_no', form.reference_no.trim())
    if (form.notes) formData.append('notes', form.notes.trim())
    if (attachmentFile) formData.append('attachment', attachmentFile)

    try {
      await api.post('/fund-transfers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toastSuccess('Mutasi transfer kas berhasil dicatat!')
      onSaved?.()
      onClose()
    } catch (err) {
      setErrors(err.validationErrors || {})
      toastError(err.userMessage || 'Gagal menyimpan mutasi transfer kas.')
    } finally {
      setSaving(false)
    }
  }

  const selectedFrom = accounts.find((a) => a.id === Number(form.from_account_id))
  const selectedTo = accounts.find((a) => a.id === Number(form.to_account_id))

  return (
    <CModal visible={visible} onClose={onClose} backdrop="static">
      <CModalHeader closeButton>
        <CModalTitle className="d-flex align-items-center gap-2">
          <CIcon icon={cilLoopCircular} className="text-primary" />
          Pengisian / Mutasi Kas Antar-Akun
        </CModalTitle>
      </CModalHeader>

      <CForm onSubmit={handleSubmit}>
        <CModalBody>
          {loadingAccounts ? (
            <div className="text-center py-4 text-body-secondary">
              <CSpinner size="sm" className="me-2" />
              Memuat akun kas...
            </div>
          ) : (
            <div className="row g-3">
              {/* Dari Akun */}
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Dari Akun (Sumber Dana) *</label>
                <CFormSelect
                  name="from_account_id"
                  value={form.from_account_id}
                  onChange={handleChange}
                  invalid={Boolean(getFieldError(errors, 'from_account_id'))}
                  feedbackInvalid={getFieldError(errors, 'from_account_id')}
                  disabled={saving}
                  required
                >
                  <option value="">-- Pilih Akun Asal --</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatCurrency(acc.current_balance)})
                    </option>
                  ))}
                </CFormSelect>
                {selectedFrom && (
                  <div className="form-text small">
                    Saldo saat ini: <strong>{formatCurrency(selectedFrom.current_balance)}</strong>
                  </div>
                )}
              </div>

              {/* Ke Akun */}
              <div className="col-md-6">
                <label className="form-label small fw-semibold">
                  Ke Akun (Tujuan / Kas Kecil) *
                </label>
                <CFormSelect
                  name="to_account_id"
                  value={form.to_account_id}
                  onChange={handleChange}
                  invalid={Boolean(getFieldError(errors, 'to_account_id'))}
                  feedbackInvalid={getFieldError(errors, 'to_account_id')}
                  disabled={saving}
                  required
                >
                  <option value="">-- Pilih Akun Tujuan --</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatCurrency(acc.current_balance)})
                    </option>
                  ))}
                </CFormSelect>
                {selectedTo && (
                  <div className="form-text small">
                    Saldo saat ini: <strong>{formatCurrency(selectedTo.current_balance)}</strong>
                    {selectedTo.imprest_limit > 0 &&
                      ` (Plafon: ${formatCurrency(selectedTo.imprest_limit)})`}
                  </div>
                )}
              </div>

              {/* Nominal */}
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Nominal Mutasi / Top-Up *</label>
                <CInputGroup>
                  <CInputGroupText className="fw-bold text-secondary">Rp</CInputGroupText>
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
                    required
                  />
                </CInputGroup>
                {getFieldError(errors, 'amount') ? (
                  <div className="invalid-feedback d-block">{getFieldError(errors, 'amount')}</div>
                ) : form.amount && !isNaN(Number(form.amount)) && Number(form.amount) > 0 ? (
                  <div className="form-text small">
                    Terbilang: <strong>{formatCurrency(form.amount)}</strong>
                  </div>
                ) : null}
              </div>

              {/* Tanggal */}
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Tanggal Mutasi *</label>
                <CFormInput
                  type="date"
                  name="transfer_date"
                  value={form.transfer_date}
                  onChange={handleChange}
                  invalid={Boolean(getFieldError(errors, 'transfer_date'))}
                  feedbackInvalid={getFieldError(errors, 'transfer_date')}
                  disabled={saving}
                  required
                />
              </div>

              {/* Reference No */}
              <div className="col-md-6">
                <label className="form-label small fw-semibold">No. Referensi / Slip Bank</label>
                <CFormInput
                  type="text"
                  name="reference_no"
                  placeholder="Contoh: REF-BCA-10293, Cek #012"
                  value={form.reference_no}
                  onChange={handleChange}
                  invalid={Boolean(getFieldError(errors, 'reference_no'))}
                  feedbackInvalid={getFieldError(errors, 'reference_no')}
                  disabled={saving}
                />
              </div>

              {/* Notes */}
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Catatan</label>
                <CFormTextarea
                  name="notes"
                  rows={2}
                  placeholder="Contoh: Pengisian dana kas kecil rutin mingguan"
                  value={form.notes}
                  onChange={handleChange}
                  invalid={Boolean(getFieldError(errors, 'notes'))}
                  feedbackInvalid={getFieldError(errors, 'notes')}
                  disabled={saving}
                />
              </div>

              {/* Bukti Transfer / Slip Bank Dropzone & Paste Area */}
              <div className="col-12">
                <label className="form-label small fw-semibold d-flex align-items-center gap-1 mb-1">
                  <CIcon icon={cilPaperclip} className="text-primary" />
                  Lampiran Bukti Transfer / Slip Bank (Opsional)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleProcessAttachment(file)
                  }}
                  disabled={saving}
                />

                {attachmentFile ? (
                  <div className="p-2 border rounded bg-success-subtle border-success-subtle d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2 small text-success-emphasis">
                      <CIcon icon={cilCheckCircle} />
                      <span className="fw-semibold text-truncate" style={{ maxWidth: '280px' }}>
                        {attachmentFile.name}
                      </span>
                      <span className="text-muted small">
                        ({(attachmentFile.size / 1024).toFixed(1)} KB)
                      </span>
                      {attachmentPreview && (
                        <CButton
                          size="sm"
                          color="link"
                          className="p-0 text-success-emphasis fw-bold text-decoration-underline"
                          onClick={() => setShowPreviewModal(true)}
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
                        onClick={() => fileInputRef.current?.click()}
                        disabled={saving}
                      >
                        Ganti
                      </CButton>
                      <CButton
                        size="sm"
                        color="link"
                        className="text-danger p-0 small text-decoration-none"
                        onClick={handleRemoveAttachment}
                      >
                        Hapus
                      </CButton>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`compact-drop-zone ${isDragging ? 'is-dragging' : ''}`}
                  >
                    <div className="d-flex align-items-center justify-content-center gap-2 text-primary mb-1">
                      <CIcon icon={cilCloudUpload} />
                      <span className="fw-semibold small">Tarik &amp; lepas file ke sini, atau klik untuk memilih</span>
                    </div>
                    <div className="text-muted small" style={{ fontSize: '0.78rem' }}>
                      Bisa langsung tekan <kbd>Ctrl + V</kbd> untuk menempel tangkapan layar / clipboard &bull; JPG, PNG, PDF (Maks. 25MB)
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={onClose} disabled={saving}>
            Batal
          </CButton>
          <CButton type="submit" color="primary" disabled={saving || loadingAccounts}>
            {saving ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Menyimpan Mutasi...
              </>
            ) : (
              'Simpan Mutasi Kas'
            )}
          </CButton>
        </CModalFooter>
      </CForm>

      {/* Lightbox Preview Modal for attached file */}
      <CModal visible={showPreviewModal} onClose={() => setShowPreviewModal(false)} size="lg">
        <CModalHeader closeButton>
          <CModalTitle className="d-flex align-items-center gap-2">
            <CIcon icon={cilImage} className="text-primary" />
            Pratinjau Bukti Transfer
          </CModalTitle>
        </CModalHeader>
        <CModalBody className="text-center p-3 bg-body-tertiary">
          {attachmentPreview && (
            <img
              src={attachmentPreview}
              alt="Bukti Transfer"
              className="img-fluid rounded shadow-sm border"
              style={{ maxHeight: '70vh', objectFit: 'contain' }}
            />
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowPreviewModal(false)}>
            Tutup
          </CButton>
        </CModalFooter>
      </CModal>
    </CModal>
  )
}

export default FundTransferModal
