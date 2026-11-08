import React, { useState, useEffect } from 'react'
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
import { cilLoopCircular } from '@coreui/icons'
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

  // Fetch accounts on open
  useEffect(() => {
    if (visible) {
      setErrors({})
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

    const payload = {
      from_account_id: Number(form.from_account_id),
      to_account_id: Number(form.to_account_id),
      amount: parseAmount(form.amount),
      transfer_date: form.transfer_date,
      reference_no: form.reference_no ? form.reference_no.trim() : null,
      notes: form.notes ? form.notes.trim() : null,
    }

    try {
      await api.post('/fund-transfers', payload)
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
    </CModal>
  )
}

export default FundTransferModal
