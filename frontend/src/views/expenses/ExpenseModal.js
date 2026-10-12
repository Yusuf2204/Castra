import React, { useEffect, useState } from 'react'
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
import { cilPencil, cilTrash, cilPlus } from '@coreui/icons'
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
  const [deletingId, setDeletingId] = useState(null)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (visible) {
      setForm({
        ...emptyForm,
        transaction_date: selectedDate || '',
      })
      setEditingItem(null)
      setErrors({})
    }
  }, [visible, selectedDate])

  const handleEditClick = (item) => {
    setEditingItem(item)
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
    setForm({
      ...emptyForm,
      transaction_date: selectedDate || '',
    })
    setErrors({})
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

    const parseAmount = (val) => (typeof val === 'string' ? Number(val.replace(',', '.')) : Number(val))

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
              <CTableHead className="table-light">
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

          <CForm onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <CFormSelect
                  label="Kategori Pengeluaran *"
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

              <div className="col-md-6">
                <label className="form-label">Nominal (Rp) *</label>
                <CInputGroup>
                  <CInputGroupText>Rp</CInputGroupText>
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
                {getFieldError(errors, 'amount') && (
                  <div className="invalid-feedback d-block">{getFieldError(errors, 'amount')}</div>
                )}
              </div>

              <div className="col-md-6">
                <CFormInput
                  type="date"
                  label="Tanggal Transaksi *"
                  name="transaction_date"
                  value={form.transaction_date}
                  onChange={handleChange}
                  invalid={Boolean(getFieldError(errors, 'transaction_date'))}
                  feedbackInvalid={getFieldError(errors, 'transaction_date')}
                  disabled={saving}
                />
              </div>

              <div className="col-md-6">
                <CFormTextarea
                  label="Catatan"
                  name="notes"
                  rows={2}
                  maxLength={500}
                  placeholder="Keterangan pengeluaran (contoh: Makan siang, bayar listrik)..."
                  value={form.notes}
                  onChange={handleChange}
                  invalid={Boolean(getFieldError(errors, 'notes'))}
                  feedbackInvalid={getFieldError(errors, 'notes')}
                  disabled={saving}
                />
              </div>
            </div>

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
  )
}

export default ExpenseModal
