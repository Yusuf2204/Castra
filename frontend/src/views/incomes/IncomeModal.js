import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
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
  CNav,
  CNavItem,
  CNavLink,
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
  cilFile,
  cilExternalLink,
  cilZoom,
  cilList,
} from '@coreui/icons'
import api from '../../services/api'
import { toastSuccess, toastError, toastWarning } from '../../services/toastService'
import { getFieldError } from '../../utils/formErrors'
import VoucherModal from '../../components/vouchers/VoucherModal'
import CustomSelect from '../../components/common/CustomSelect'

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
  voucher_no: '',
  notes: '',
  transaction_date: '',
  attachment_path: '',
}

const emptyOcrFlags = {
  amount: false,
  transaction_date: false,
  notes: false,
  category_id: false,
  account_id: false,
}

const IncomeModal = ({
  visible,
  onClose,
  selectedDate,
  dailyItems = [],
  incomeSources = [],
  categories = [],
  onSaved,
}) => {
  const [form, setForm] = useState(emptyForm)
  const [editingItem, setEditingItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [scannedProof, setScannedProof] = useState(null)
  const [proofImagePreview, setProofImagePreview] = useState(null)
  const [showImagePreviewModal, setShowImagePreviewModal] = useState(false)
  const [ocrAutoFilled, setOcrAutoFilled] = useState(emptyOcrFlags)
  const [deletingId, setDeletingId] = useState(null)
  const [errors, setErrors] = useState({})
  const [accounts, setAccounts] = useState([])
  const [voucherItem, setVoucherItem] = useState(null)
  const [showVoucherModal, setShowVoucherModal] = useState(false)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [autoOcr, setAutoOcr] = useState(true)
  const [lastSavedId, setLastSavedId] = useState(null)
  const [activeTab, setActiveTab] = useState('form')
  const fileInputRef = useRef(null)

  const accountOptions = useMemo(() => {
    return accounts.map((acc) => {
      const typeLabel =
        acc.type === 'petty_cash'
          ? 'Kas Kecil'
          : acc.type === 'bank'
            ? 'Bank'
            : acc.type === 'e_wallet'
              ? 'E-Wallet'
              : 'Tunai'
      return {
        value: acc.id,
        label: `${acc.name} (${typeLabel}) - Sisa: ${formatCurrency(acc.current_balance)}`,
      }
    })
  }, [accounts])

  const categoryOptions = useMemo(() => {
    return categories
      .filter((c) => c.is_active || c.id === Number(form.category_id))
      .map((c) => ({
        value: c.id,
        label: c.name,
      }))
  }, [categories, form.category_id])

  // Reset modal state on open/close and fetch accounts
  useEffect(() => {
    if (visible) {
      setForm({
        ...emptyForm,
        transaction_date: selectedDate || '',
      })
      setEditingItem(null)
      setActiveTab('form')
      setScannedProof(null)
      setProofImagePreview(null)
      setShowImagePreviewModal(false)
      setOcrAutoFilled(emptyOcrFlags)
      setErrors({})

      api
        .get('/accounts', { params: { all: 1, is_active: 1 } })
        .then((res) => {
          const accList = res.data?.data || []
          setAccounts(accList)
          const defaultAcc = accList.find((a) => a.type === 'bank') || accList[0]
          if (defaultAcc) {
            setForm((prev) => ({
              ...prev,
              account_id: prev.account_id || String(defaultAcc.id),
            }))
          }
        })
        .catch(() => {})
    }
  }, [visible, selectedDate])

  // Cleanup object URL on unmount or proof reset
  useEffect(() => {
    return () => {
      if (proofImagePreview && proofImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(proofImagePreview)
      }
    }
  }, [proofImagePreview])

  // Unified proof handler (supports both auto OCR scan and direct attachment)
  const handleProofFile = useCallback(
    async (file, forceOcr = null) => {
      if (!file) return

      const isPdfFile =
        file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')
      const isImageFile = file.type?.startsWith('image/')

      if (!isImageFile && !isPdfFile) {
        toastError('Format file harus berupa gambar (JPG, PNG, WEBP) atau PDF.')
        return
      }

      if (file.size > 25 * 1024 * 1024) {
        toastError('Ukuran file maksimal adalah 25MB.')
        return
      }

      const shouldOcr = forceOcr !== null ? forceOcr : autoOcr && isImageFile

      // For images, set local blob preview
      if (isImageFile) {
        if (proofImagePreview && proofImagePreview.startsWith('blob:')) {
          URL.revokeObjectURL(proofImagePreview)
        }
        setProofImagePreview(URL.createObjectURL(file))
      }

      const formData = new FormData()
      formData.append('receipt', file)

      if (shouldOcr) {
        setScanning(true)
        try {
          const res = await api.post('/incomes/scan-receipt', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          const data = res.data?.data || {}

          const newOcrFlags = {
            amount: data.amount != null,
            transaction_date: Boolean(data.transaction_date),
            notes: Boolean(data.notes),
            category_id: Boolean(data.suggested_category_id),
            account_id: Boolean(data.suggested_account_id),
          }

          setForm((prev) => ({
            ...prev,
            amount: data.amount != null ? String(data.amount) : prev.amount,
            transaction_date: data.transaction_date || prev.transaction_date,
            notes: data.notes || prev.notes,
            category_id: data.suggested_category_id
              ? String(data.suggested_category_id)
              : prev.category_id,
            account_id: data.suggested_account_id
              ? String(data.suggested_account_id)
              : prev.account_id,
            attachment_path: data.attachment_path || prev.attachment_path,
          }))

          setOcrAutoFilled(newOcrFlags)

          setScannedProof({
            sender: data.merchant || 'Bukti Pemasukan',
            amount: data.amount,
            transaction_date: data.transaction_date,
            suggested_category_name: data.suggested_category_name,
            suggested_account_name: data.suggested_account_name,
            fileName: file.name,
            attachment_url: data.attachment_url,
            isOcr: true,
          })

          if (data.amount) {
            toastSuccess(
              `Bukti berhasil dibaca & dilampirkan: ${data.merchant || 'Pemasukan'} (${formatCurrency(data.amount)})`,
            )
          } else {
            toastWarning(
              'Bukti dilampirkan. Nominal tidak terdeteksi otomatis, silakan sesuaikan nominal di formulir.',
            )
          }
        } catch (err) {
          // Fallback to direct upload if OCR failed without throwing an alarming error toast
          try {
            const fallbackRes = await api.post('/incomes/upload-receipt', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            })
            const fbData = fallbackRes.data?.data || {}
            setForm((prev) => ({ ...prev, attachment_path: fbData.attachment_path }))
            setProofImagePreview(fbData.attachment_url)
            setScannedProof({
              fileName: file.name,
              attachment_url: fbData.attachment_url,
              isOcr: false,
            })
            toastSuccess(`Bukti transaksi "${file.name}" berhasil disimpan sebagai lampiran.`)
          } catch (fbErr) {
            toastError(fbErr.userMessage || 'Gagal menyimpan lampiran berkas.')
          }
        } finally {
          setScanning(false)
          if (fileInputRef.current) fileInputRef.current.value = ''
        }
      } else {
        setUploadingReceipt(true)
        try {
          const res = await api.post('/incomes/upload-receipt', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          const data = res.data?.data || {}
          setForm((prev) => ({
            ...prev,
            attachment_path: data.attachment_path,
          }))
          setProofImagePreview(data.attachment_url)
          setScannedProof({
            fileName: file.name,
            attachment_url: data.attachment_url,
            isOcr: false,
          })
          toastSuccess(`Bukti transfer "${file.name}" berhasil dilampirkan!`)
        } catch (err) {
          toastError(err.userMessage || 'Gagal mengunggah bukti pemasukan.')
        } finally {
          setUploadingReceipt(false)
          if (fileInputRef.current) fileInputRef.current.value = ''
        }
      }
    },
    [autoOcr, proofImagePreview],
  )

  const handleClearProof = () => {
    if (proofImagePreview && proofImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(proofImagePreview)
    }
    setScannedProof(null)
    setProofImagePreview(null)
    setOcrAutoFilled(emptyOcrFlags)
    setForm((prev) => ({ ...prev, attachment_path: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Listen to paste event (Ctrl+V) when modal is open
  useEffect(() => {
    if (!visible || scanning || uploadingReceipt) return

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

      if (
        file &&
        (file.type.startsWith('image/') ||
          file.name.toLowerCase().endsWith('.pdf') ||
          file.type === 'application/pdf')
      ) {
        e.preventDefault()
        handleProofFile(file)
        toastSuccess('Tangkapan layar / berkas dari clipboard berhasil ditempel!')
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [visible, scanning, uploadingReceipt, handleProofFile])

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
      handleProofFile(file)
    }
  }

  const handleEditClick = (item) => {
    setEditingItem(item)
    handleClearProof()
    setForm({
      account_id: item.account_id ? String(item.account_id) : '',
      transaction_date: item.transaction_date || selectedDate,
      category_id: item.category_id ? String(item.category_id) : '',
      amount: item.amount != null ? String(item.amount) : '',
      voucher_no: item.voucher_no || '',
      notes: item.notes || '',
      attachment_path: item.attachment_path || '',
    })
    if (item.attachment_url) {
      setProofImagePreview(item.attachment_url)
    } else if (item.attachment_path) {
      setProofImagePreview(`/storage/${item.attachment_path}`)
    }
    setErrors({})
    setActiveTab('form')
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
    setActiveTab('form')
    handleClearProof()
    setForm({
      ...emptyForm,
      transaction_date: selectedDate || '',
    })
    setErrors({})
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setErrors((prev) => ({ ...prev, [name]: null }))
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
      category_id: form.category_id ? Number(form.category_id) : null,
      transaction_date: form.transaction_date,
      amount: parseAmount(form.amount),
      voucher_no: form.voucher_no ? form.voucher_no.trim() : null,
      notes: form.notes ? form.notes.trim() : null,
      attachment_path: form.attachment_path || null,
    }

    try {
      let savedId = null
      if (editingItem) {
        await api.put(`/incomes/${editingItem.id}`, payload)
        savedId = editingItem.id
        toastSuccess('Transaksi pemasukan berhasil diperbarui')
      } else {
        const res = await api.post('/incomes', payload)
        savedId = res.data?.data?.id
        toastSuccess('Transaksi pemasukan berhasil dicatat')
      }

      setLastSavedId(savedId)
      setEditingItem(null)
      setActiveTab('form')
      handleClearProof()
      setForm({
        ...emptyForm,
        transaction_date: selectedDate || '',
      })
      onSaved?.()
    } catch (err) {
      setErrors(err.validationErrors || {})
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus transaksi pemasukan ini?')) return

    setDeletingId(id)
    try {
      await api.delete(`/incomes/${id}`)
      toastSuccess('Transaksi pemasukan berhasil dihapus')
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
      <CModal size="xl" visible={visible} onClose={onClose} backdrop="static">
        <CModalHeader closeButton>
          <CModalTitle className="d-flex align-items-center gap-2">
            <span>Pemasukan: {formatDateIndonesian(selectedDate)}</span>
            {totalDaily > 0 && (
              <CBadge color="success" className="ms-2 fs-6">
                Total: {formatCurrency(totalDaily)}
              </CBadge>
            )}
          </CModalTitle>
        </CModalHeader>

        <CModalBody className="p-3 p-md-4">
          {/* Navigation Tabs: Input Transaksi vs Detail Transaksi */}
          <CNav variant="tabs" className="mb-4">
            <CNavItem>
              <CNavLink
                active={activeTab === 'form'}
                onClick={() => setActiveTab('form')}
                className="cursor-pointer fw-semibold d-flex align-items-center gap-2"
                role="button"
              >
                <CIcon icon={cilPencil} className="text-success" />
                <span>{editingItem ? 'Edit Transaksi' : 'Input Transaksi'}</span>
                {editingItem && (
                  <CBadge color="warning" className="small">
                    Edit
                  </CBadge>
                )}
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink
                active={activeTab === 'detail'}
                onClick={() => setActiveTab('detail')}
                className="cursor-pointer fw-semibold d-flex align-items-center gap-2"
                role="button"
              >
                <CIcon icon={cilList} className="text-secondary" />
                <span>Detail Transaksi</span>
                <CBadge
                  color={dailyItems.length > 0 ? 'success' : 'secondary'}
                  shape="rounded-pill"
                >
                  {dailyItems.length}
                </CBadge>
              </CNavLink>
            </CNavItem>
          </CNav>

          {/* TAB 2: Detail & Riwayat Transaksi */}
          {activeTab === 'detail' && (
            <div className="mb-3">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 p-3 bg-body-tertiary rounded border">
                <div>
                  <h6 className="fw-bold mb-1">Riwayat Pemasukan: {formatDateIndonesian(selectedDate)}</h6>
                  <div className="text-body-secondary small">
                    Total tercatat pada tanggal ini: <strong>{dailyItems.length} transaksi</strong>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {totalDaily > 0 && (
                    <CBadge color="success" className="fs-6 py-2 px-3">
                      Total: {formatCurrency(totalDaily)}
                    </CBadge>
                  )}
                  <CButton
                    size="sm"
                    color="success"
                    className="text-white d-flex align-items-center gap-1"
                    onClick={() => {
                      handleCancelEdit()
                      setActiveTab('form')
                    }}
                  >
                    <CIcon icon={cilPlus} />
                    Catat Pemasukan Baru
                  </CButton>
                </div>
              </div>

              {dailyItems.length === 0 ? (
                <div className="text-center p-5 border rounded bg-body-tertiary my-2">
                  <CIcon icon={cilList} size="3xl" className="text-secondary opacity-50 mb-3" />
                  <h6 className="fw-bold">Belum Ada Transaksi Pemasukan</h6>
                  <p className="text-body-secondary small mb-3">
                    Belum ada transaksi pemasukan tercatat pada tanggal {formatDateIndonesian(selectedDate)}.
                  </p>
                  <CButton
                    color="success"
                    size="sm"
                    className="text-white"
                    onClick={() => {
                      handleCancelEdit()
                      setActiveTab('form')
                    }}
                  >
                    <CIcon icon={cilPlus} className="me-1" />
                    Input Transaksi Sekarang
                  </CButton>
                </div>
              ) : (
                <CTable hover responsive small className="border align-middle">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>No. Bukti / Tanggal</CTableHeaderCell>
                      <CTableHeaderCell>Masuk ke Akun</CTableHeaderCell>
                      <CTableHeaderCell>Kategori Pemasukan</CTableHeaderCell>
                      <CTableHeaderCell>Catatan</CTableHeaderCell>
                      <CTableHeaderCell>Nominal</CTableHeaderCell>
                      <CTableHeaderCell width={85} className="text-center">
                        Bukti
                      </CTableHeaderCell>
                      <CTableHeaderCell width={120} className="text-center">Aksi</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {dailyItems.map((item) => (
                      <CTableRow
                        key={item.id}
                        className={
                          editingItem?.id === item.id
                            ? 'row-highlight-editing border-start border-3 border-primary'
                            : lastSavedId === item.id
                            ? 'row-highlight-saved border-start border-3 border-success'
                            : ''
                        }
                      >
                        <CTableDataCell>
                          {item.voucher_no && (
                            <div className="small font-monospace text-secondary mb-1">
                              {item.voucher_no}
                            </div>
                          )}
                          <div className="d-flex align-items-center gap-1">
                            <strong>{item.transaction_date || '-'}</strong>
                            {editingItem?.id === item.id && (
                              <span className="badge bg-primary-subtle text-primary border border-primary-subtle py-0 px-1 small" style={{ fontSize: '10px' }}>
                                Diedit
                              </span>
                            )}
                            {lastSavedId === item.id && (
                              <span className="badge bg-success-subtle text-success border border-success-subtle py-0 px-1 small" style={{ fontSize: '10px' }}>
                                Disimpan
                              </span>
                            )}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          {item.account ? (
                            <span
                              className={`badge small ${
                                item.account.type === 'petty_cash'
                                  ? 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                                  : 'bg-secondary-subtle text-secondary border border-secondary-subtle'
                              }`}
                            >
                              {item.account.name}
                            </span>
                          ) : (
                            <span className="text-body-secondary small">-</span>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          {item.category?.name ? (
                            <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle small">
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
                              const url =
                                item.attachment_url || `/storage/${item.attachment_path}`
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
                                    onClick={() => {
                                      setProofImagePreview(url)
                                      setShowImagePreviewModal(true)
                                    }}
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
                                  title="Klik untuk melihat bukti penuh"
                                  onClick={() => {
                                    setProofImagePreview(url)
                                    setShowImagePreviewModal(true)
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      setProofImagePreview(url)
                                      setShowImagePreviewModal(true)
                                    }
                                  }}
                                  className="d-inline-block position-relative rounded overflow-hidden border shadow-sm cursor-pointer"
                                  style={{
                                    width: '38px',
                                    height: '38px',
                                    verticalAlign: 'middle',
                                  }}
                                >
                                  <img
                                    src={url}
                                    alt="Bukti Transfer"
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
                            onClick={() => {
                              setVoucherItem(item)
                              setShowVoucherModal(true)
                            }}
                            className="p-1 me-1 text-success"
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
              )}
            </div>
          )}

          {/* TAB 1: Input / Edit Transaksi */}
          {activeTab === 'form' && (
            <div>
              {editingItem && (
                <div className="alert alert-warning d-flex align-items-center justify-content-between p-3 mb-3 rounded border border-warning-subtle bg-warning-subtle text-warning-emphasis">
                  <div className="d-flex align-items-center gap-2">
                    <CIcon icon={cilPencil} size="lg" />
                    <div>
                      <div className="fw-bold">Mode Edit Transaksi</div>
                      <div className="small">
                        Mengubah transaksi:{' '}
                        <strong>{editingItem.voucher_no || editingItem.income_source?.name}</strong>{' '}
                        ({formatCurrency(editingItem.amount)})
                      </div>
                    </div>
                  </div>
                  <CButton size="sm" color="warning" variant="outline" onClick={handleCancelEdit}>
                    <CIcon icon={cilPlus} className="me-1" />
                    Batal Edit &amp; Catat Baru
                  </CButton>
                </div>
              )}

              {/* Formulir Input / Edit */}
              <div className="border rounded p-3 bg-body-tertiary">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0">
                    {editingItem ? 'Edit Transaksi Pemasukan' : 'Catat Pemasukan Baru'}
                  </h6>
                  <div className="d-flex align-items-center gap-2">
                    {dailyItems.length > 0 && (
                      <CButton
                        size="sm"
                        color="outline-secondary"
                        onClick={() => setActiveTab('detail')}
                        className="d-flex align-items-center gap-1"
                      >
                        <CIcon icon={cilList} />
                        Lihat Detail ({dailyItems.length})
                      </CButton>
                    )}
                    {editingItem && (
                      <CButton size="sm" color="outline-secondary" onClick={handleCancelEdit}>
                        <CIcon icon={cilPlus} className="me-1" />
                        Catat Baru
                      </CButton>
                    )}
                  </div>
                </div>

                {/* Unified Bukti Transaksi / Slip Pemasukan (Drag & Drop, Paste Ctrl+V, Auto OCR) */}
            <div className="mb-4">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="d-none"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleProofFile(f)
                }}
                disabled={scanning || uploadingReceipt || saving}
              />

              {scanning || uploadingReceipt ? (
                /* Loading State */
                <div className="receipt-drop-zone text-center p-3">
                  <CSpinner size="sm" color="success" className="mb-2" />
                  <div className="small fw-semibold text-body">
                    {scanning
                      ? 'Membaca bukti pemasukan dengan Tesseract OCR...'
                      : 'Mengunggah berkas bukti transaksi...'}
                  </div>
                  <div className="receipt-drop-hint">
                    {scanning
                      ? 'Sedang mendeteksi nominal transfer, tanggal, dan pengirim'
                      : 'Menyimpan berkas ke server'}
                  </div>
                </div>
              ) : form.attachment_path || proofImagePreview ? (
                /* Attached Proof Card with Thumbnail & Metadata */
                <div className="p-3 rounded border bg-body">
                  <div className="d-flex flex-column flex-sm-row gap-3 align-items-start align-items-sm-center justify-content-between">
                    {/* Left: Thumbnail & Details */}
                    <div className="d-flex gap-3 align-items-center flex-grow-1 overflow-hidden">
                      {Boolean(
                        form.attachment_path?.toLowerCase().endsWith('.pdf') ||
                          proofImagePreview?.toLowerCase().includes('.pdf') ||
                          scannedProof?.fileName?.toLowerCase().endsWith('.pdf'),
                      ) ? (
                        <div
                          className="rounded border d-flex flex-column align-items-center justify-content-center bg-danger-subtle text-danger flex-shrink-0"
                          style={{ width: '52px', height: '52px' }}
                        >
                          <CIcon icon={cilFile} size="xl" />
                          <span style={{ fontSize: '9px', fontWeight: 'bold' }}>PDF</span>
                        </div>
                      ) : proofImagePreview ? (
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
                            src={proofImagePreview}
                            alt="Thumbnail Bukti"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div
                            className="position-absolute bottom-0 start-0 end-0 text-center bg-dark bg-opacity-75 text-white"
                            style={{ fontSize: '9px', lineHeight: '14px' }}
                          >
                            Lihat
                          </div>
                        </div>
                      ) : (
                        <div
                          className="rounded border d-flex align-items-center justify-content-center bg-body-secondary flex-shrink-0"
                          style={{ width: '52px', height: '52px' }}
                        >
                          <CIcon icon={cilPaperclip} />
                        </div>
                      )}

                      <div className="overflow-hidden">
                        <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                          <CBadge color="success" className="py-1">
                            <CIcon icon={cilCheckCircle} className="me-1" />
                            Bukti Terlampir
                          </CBadge>
                          {scannedProof?.isOcr && (
                            <CBadge color="info" className="py-1">
                              ✨ AI OCR
                            </CBadge>
                          )}
                          {scannedProof?.sender && (
                            <span className="fw-bold text-body small text-truncate">
                              {scannedProof.sender}
                            </span>
                          )}
                        </div>

                        <div className="text-body-secondary small text-truncate d-flex flex-wrap gap-2 align-items-center">
                          {scannedProof?.amount ? (
                            <span>
                              Nominal:{' '}
                              <strong className="text-success">
                                {formatCurrency(scannedProof.amount)}
                              </strong>
                            </span>
                          ) : form.attachment_path ? (
                            <span className="font-monospace small">
                              {form.attachment_path.split('/').pop()}
                            </span>
                          ) : (
                            <span>Berkas siap disimpan</span>
                          )}
                          {scannedProof?.suggested_income_source_name && (
                            <span>
                              &bull; Sumber:{' '}
                              <strong className="text-primary">
                                {scannedProof.suggested_income_source_name}
                              </strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="d-flex gap-2 flex-shrink-0 align-self-end align-self-sm-center">
                      {Boolean(
                        form.attachment_path?.toLowerCase().endsWith('.pdf') ||
                          proofImagePreview?.toLowerCase().includes('.pdf') ||
                          scannedProof?.fileName?.toLowerCase().endsWith('.pdf'),
                      ) ? (
                        <a
                          href={proofImagePreview || `/storage/${form.attachment_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary"
                          title="Buka dokumen PDF di tab baru"
                        >
                          <CIcon icon={cilExternalLink} className="me-1" />
                          Buka PDF
                        </a>
                      ) : (
                        proofImagePreview && (
                          <CButton
                            size="sm"
                            color="outline-primary"
                            onClick={() => setShowImagePreviewModal(true)}
                            title="Lihat foto penuh"
                          >
                            <CIcon icon={cilZoom} className="me-1" />
                            Lihat
                          </CButton>
                        )
                      )}
                      <CButton
                        size="sm"
                        color="secondary"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={saving || scanning || uploadingReceipt}
                        title="Ganti file bukti"
                      >
                        <CIcon icon={cilReload} className="me-1" />
                        Ganti
                      </CButton>
                      <CButton
                        size="sm"
                        color="danger"
                        variant="ghost"
                        onClick={handleClearProof}
                        disabled={saving || scanning || uploadingReceipt}
                        title="Hapus lampiran bukti transfer"
                      >
                        <CIcon icon={cilXCircle} className="me-1" />
                        Hapus
                      </CButton>
                    </div>
                  </div>
                </div>
              ) : (
                /* Clean Unified Dropzone */
                <div className="receipt-drop-zone-wrapper">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label mb-0 fw-semibold small d-flex align-items-center gap-1">
                      <CIcon icon={cilPaperclip} className="text-success" />
                      Bukti Transaksi / Slip Pemasukan
                      <span className="text-body-secondary fw-normal">(Opsional)</span>
                    </label>
                    <div className="form-check form-switch mb-0 small">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="autoOcrSwitchIncome"
                        checked={autoOcr}
                        onChange={(e) => setAutoOcr(e.target.checked)}
                        disabled={saving}
                      />
                      <label
                        className="form-check-label small text-body-secondary cursor-pointer"
                        htmlFor="autoOcrSwitchIncome"
                      >
                        Pindai otomatis dengan AI OCR
                      </label>
                    </div>
                  </div>

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
                        color="success"
                        className="text-white"
                        onClick={(e) => {
                          e.stopPropagation()
                          fileInputRef.current?.click()
                        }}
                        disabled={saving}
                      >
                        <CIcon icon={cilCloudUpload} className="me-1" />
                        Pilih Berkas Bukti / Transfer
                      </CButton>
                    </div>
                    <div className="receipt-drop-hint">
                      Tarik &amp; lepas file ke sini, atau tekan <kbd>Ctrl + V</kbd> untuk menempelkan gambar / slip
                    </div>
                    <div className="text-body-secondary small mt-1" style={{ fontSize: '11px' }}>
                      Mendukung JPG, PNG, WEBP, atau PDF (maks. 25 MB)
                    </div>
                  </div>
                </div>
              )}
            </div>

            <CForm onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* Account / Rekening Kas Masuk */}
                <div className="col-md-6">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <label className="form-label mb-0 fw-semibold small">
                      Masuk ke Rekening / Kas *
                    </label>
                    {ocrAutoFilled.account_id && (
                      <span className="badge bg-success-subtle text-success border border-success-subtle py-0 px-2 small">
                        <CIcon icon={cilCheck} size="sm" className="me-1" />
                        Disarankan dari Bukti
                      </span>
                    )}
                  </div>
                  <CustomSelect
                    name="account_id"
                    value={form.account_id}
                    onChange={handleChange}
                    options={accountOptions}
                    placeholder="-- Pilih Akun Kas / Bank --"
                    invalid={Boolean(getFieldError(errors, 'account_id'))}
                    feedbackInvalid={getFieldError(errors, 'account_id')}
                    disabled={saving}
                  />
                </div>

                {/* Income Category */}
                <div className="col-md-6">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <label className="form-label mb-0 fw-semibold small">
                      Kategori Pemasukan *
                    </label>
                    {ocrAutoFilled.category_id && (
                      <span className="badge bg-success-subtle text-success border border-success-subtle py-0 px-2 small">
                        <CIcon icon={cilCheck} size="sm" className="me-1" />
                        Disarankan dari Bukti
                      </span>
                    )}
                  </div>
                  <CustomSelect
                    name="category_id"
                    value={form.category_id}
                    onChange={handleChange}
                    options={categoryOptions}
                    placeholder="-- Cari / Pilih Kategori --"
                    invalid={Boolean(getFieldError(errors, 'category_id'))}
                    feedbackInvalid={getFieldError(errors, 'category_id')}
                    disabled={saving}
                  />
                </div>

                {/* Amount with Live Terbilang Preview */}
                <div className="col-md-6">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <label className="form-label mb-0 fw-semibold small">Nominal (Rp) *</label>
                    {ocrAutoFilled.amount && (
                      <span className="badge bg-success-subtle text-success border border-success-subtle py-0 px-2 small">
                        <CIcon icon={cilCheck} size="sm" className="me-1" />
                        Terisi dari Bukti
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
                        Terisi dari Bukti
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

                {/* Voucher Number (BKM) */}
                <div className="col-md-6">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <label className="form-label mb-0 fw-semibold small">
                      No. Bukti Kas Masuk (BKM)
                    </label>
                    <span className="text-body-secondary small">(Opsional / Otomatis)</span>
                  </div>
                  <CFormInput
                    type="text"
                    name="voucher_no"
                    maxLength={50}
                    placeholder="Nomor bukti kas masuk (otomatis jika kosong)..."
                    value={form.voucher_no}
                    onChange={handleChange}
                    invalid={Boolean(getFieldError(errors, 'voucher_no'))}
                    feedbackInvalid={getFieldError(errors, 'voucher_no')}
                    disabled={saving}
                  />
                </div>

                {/* Notes */}
                <div className="col-12">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <label className="form-label mb-0 fw-semibold small">
                      Catatan / Keterangan
                    </label>
                    {ocrAutoFilled.notes && (
                      <span className="badge bg-success-subtle text-success border border-success-subtle py-0 px-2 small">
                        <CIcon icon={cilCheck} size="sm" className="me-1" />
                        Terisi Pengirim/Deskripsi
                      </span>
                    )}
                  </div>
                  <CFormTextarea
                    name="notes"
                    rows={2}
                    maxLength={500}
                    placeholder="Tuliskan keterangan atau rincian penerimaan..."
                    value={form.notes}
                    onChange={handleChange}
                    invalid={Boolean(getFieldError(errors, 'notes'))}
                    feedbackInvalid={getFieldError(errors, 'notes')}
                    disabled={saving}
                  />
                </div>

              </div>

              {/* Friendly Hint if OCR was used */}
              {scannedProof && (
                <div className="d-flex align-items-center gap-2 mt-3 p-2 bg-info-subtle border border-info-subtle rounded small text-info-emphasis">
                  <CIcon icon={cilInfo} className="flex-shrink-0" />
                  <span>
                    Data di atas diisi otomatis dari hasil baca bukti transfer. Anda tetap dapat
                    mengedit atau menyesuaikan nilai sebelum menyimpan.
                  </span>
                </div>
              )}

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
                <CButton type="submit" color="success" className="text-white" disabled={saving}>
                  {saving ? (
                    <>
                      <CSpinner size="sm" className="me-2" />
                      Menyimpan...
                    </>
                  ) : editingItem ? (
                    'Simpan Perubahan'
                  ) : (
                    'Simpan Pemasukan'
                  )}
                </CButton>
              </div>
            </CForm>
          </div>
        </div>
      )}
    </CModalBody>

    <CModalFooter>
      <CButton color="secondary" onClick={onClose} disabled={saving}>
        Tutup
      </CButton>
    </CModalFooter>
      </CModal>

      {/* Lightbox Modal for Full Proof Image Preview */}
      <CModal
        size="lg"
        visible={showImagePreviewModal}
        onClose={() => setShowImagePreviewModal(false)}
      >
        <CModalHeader closeButton>
          <CModalTitle className="d-flex align-items-center gap-2">
            <CIcon icon={cilImage} className="text-success" />
            Pratinjau Bukti Pemasukan
          </CModalTitle>
        </CModalHeader>
        <CModalBody className="text-center p-3 bg-body-tertiary">
          {proofImagePreview ? (
            proofImagePreview.toLowerCase().includes('.pdf') ? (
              <iframe
                src={proofImagePreview}
                title="Dokumen Bukti Pemasukan"
                width="100%"
                height="500px"
                className="border rounded bg-white"
              />
            ) : (
              <img
                src={proofImagePreview}
                alt="Foto Bukti Pemasukan"
                className="img-fluid rounded shadow-sm border"
                style={{ maxHeight: '72vh', objectFit: 'contain' }}
              />
            )
          ) : (
            <p className="text-muted">Tidak ada foto bukti untuk ditampilkan.</p>
          )}
        </CModalBody>
        <CModalFooter className="d-flex justify-content-between align-items-center">
          <div>
            {proofImagePreview && (
              <a
                href={proofImagePreview}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="btn btn-outline-success btn-sm d-inline-flex align-items-center gap-1"
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
        type="income"
      />
    </>
  )
}

export default IncomeModal
