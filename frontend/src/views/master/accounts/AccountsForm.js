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
  CFormSwitch,
  CInputGroup,
  CInputGroupText,
  CSpinner,
} from '@coreui/react'
import api from '../../../services/api'
import { toastSuccess, toastError } from '../../../services/toastService'
import { getFieldError } from '../../../utils/formErrors'

const emptyForm = {
  name: '',
  type: 'petty_cash',
  account_number: '',
  currency: 'IDR',
  initial_balance: '0',
  imprest_limit: '',
  is_active: true,
}

const AccountsForm = ({ visible, onClose, account, onSaved }) => {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (visible) {
      setErrors({})
      if (account) {
        setForm({
          name: account.name || '',
          type: account.type || 'cash',
          account_number: account.account_number || '',
          currency: account.currency || 'IDR',
          initial_balance: account.initial_balance != null ? String(account.initial_balance) : '0',
          imprest_limit: account.imprest_limit != null ? String(account.imprest_limit) : '',
          is_active: Boolean(account.is_active),
        })
      } else {
        setForm(emptyForm)
      }
    }
  }, [visible, account])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setErrors((prev) => ({ ...prev, [name]: null }))
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})

    const payload = {
      name: form.name.trim(),
      type: form.type,
      account_number: form.account_number ? form.account_number.trim() : null,
      currency: form.currency || 'IDR',
      initial_balance: Number(form.initial_balance || 0),
      imprest_limit: form.imprest_limit ? Number(form.imprest_limit) : null,
      is_active: Boolean(form.is_active),
    }

    try {
      if (account) {
        await api.put(`/accounts/${account.id}`, payload)
        toastSuccess('Akun kas/bank berhasil diperbarui')
      } else {
        await api.post('/accounts', payload)
        toastSuccess('Akun kas/bank berhasil ditambahkan')
      }
      onSaved?.()
      onClose()
    } catch (err) {
      setErrors(err.validationErrors || {})
      toastError(err.userMessage || 'Gagal menyimpan akun kas.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} backdrop="static">
      <CModalHeader closeButton>
        <CModalTitle>
          {account ? 'Edit Akun Kas / Bank' : 'Tambah Akun Kas / Bank Baru'}
        </CModalTitle>
      </CModalHeader>

      <CForm onSubmit={handleSubmit}>
        <CModalBody>
          <div className="row g-3">
            {/* Nama Akun */}
            <div className="col-12">
              <label className="form-label small fw-semibold">Nama Akun *</label>
              <CFormInput
                type="text"
                name="name"
                maxLength={100}
                placeholder="Contoh: Kas Kecil Kantor, Bank BCA Operasional"
                value={form.name}
                onChange={handleChange}
                invalid={Boolean(getFieldError(errors, 'name'))}
                feedbackInvalid={getFieldError(errors, 'name')}
                disabled={saving}
                required
              />
            </div>

            {/* Tipe Akun */}
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Tipe Akun *</label>
              <CFormSelect
                name="type"
                value={form.type}
                onChange={handleChange}
                disabled={saving}
                required
              >
                <option value="petty_cash">Kas Kecil (Petty Cash)</option>
                <option value="bank">Rekening Bank</option>
                <option value="cash">Kas Tunai / Brankas</option>
                <option value="e_wallet">Dompet Digital (E-Wallet)</option>
                <option value="other">Lainnya</option>
              </CFormSelect>
            </div>

            {/* Nomor Rekening */}
            <div className="col-md-6">
              <label className="form-label small fw-semibold">No. Rekening / ID Dompet</label>
              <CFormInput
                type="text"
                name="account_number"
                maxLength={50}
                placeholder="Contoh: 123-456-7890"
                value={form.account_number}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            {/* Mata Uang (Currency) */}
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Mata Uang *</label>
              <CFormSelect
                name="currency"
                value={form.currency || 'IDR'}
                onChange={handleChange}
                disabled={saving}
                required
              >
                <option value="IDR">IDR - Rupiah Indonesia (Rp)</option>
                <option value="USD">USD - US Dollar ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="SGD">SGD - Singapore Dollar (S$)</option>
                <option value="MYR">MYR - Malaysian Ringgit (RM)</option>
                <option value="JPY">JPY - Japanese Yen (¥)</option>
                <option value="GBP">GBP - British Pound (£)</option>
                <option value="AUD">AUD - Australian Dollar (A$)</option>
              </CFormSelect>
            </div>

            {/* Saldo Awal */}
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Saldo Awal (Rp)</label>
              <CInputGroup>
                <CInputGroupText className="fw-bold text-secondary">Rp</CInputGroupText>
                <CFormInput
                  type="number"
                  name="initial_balance"
                  min="0"
                  step="any"
                  value={form.initial_balance}
                  onChange={handleChange}
                  disabled={saving}
                />
              </CInputGroup>
            </div>

            {/* Plafon Kas Kecil (Imprest Limit) */}
            <div className="col-md-6">
              <label className="form-label small fw-semibold">
                Plafon Kas Kecil (Imprest Limit)
              </label>
              <CInputGroup>
                <CInputGroupText className="fw-bold text-secondary">Rp</CInputGroupText>
                <CFormInput
                  type="number"
                  name="imprest_limit"
                  min="0"
                  step="any"
                  placeholder="Opsional"
                  value={form.imprest_limit}
                  onChange={handleChange}
                  disabled={saving}
                />
              </CInputGroup>
              <div className="form-text small">Batas dana tetap untuk sistem imprest.</div>
            </div>

            {/* Status Aktif */}
            <div className="col-12 mt-3">
              <CFormSwitch
                id="is_active_account"
                name="is_active"
                label="Akun Aktif (Dapat digunakan untuk transaksi)"
                checked={form.is_active}
                onChange={handleChange}
                disabled={saving}
              />
            </div>
          </div>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={onClose} disabled={saving}>
            Batal
          </CButton>
          <CButton type="submit" color="primary" disabled={saving}>
            {saving ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Menyimpan...
              </>
            ) : account ? (
              'Simpan Perubahan'
            ) : (
              'Tambah Akun'
            )}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}

export default AccountsForm
