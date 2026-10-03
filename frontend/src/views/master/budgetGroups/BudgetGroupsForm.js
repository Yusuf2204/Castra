import React, { useEffect, useState } from 'react'
import {
  CForm,
  CFormInput,
  CFormSwitch,
  CButton,
  CSpinner,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react'
import api from '../../../services/api'
import { toastSuccess } from '../../../services/toastService'
import { getFieldError } from '../../../utils/formErrors'

const emptyForm = {
  code: '',
  name: '',
  percentage: '0',
  sort_order: '0',
  is_active: true,
}

const BudgetGroupsForm = ({ budgetGroup, onReset, onSaved }) => {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (budgetGroup) {
      setForm({
        code: budgetGroup.code || '',
        name: budgetGroup.name || '',
        percentage: budgetGroup.percentage != null ? String(budgetGroup.percentage) : '0',
        sort_order: budgetGroup.sort_order != null ? String(budgetGroup.sort_order) : '0',
        is_active: Boolean(budgetGroup.is_active),
      })
    } else {
      setForm(emptyForm)
    }
    setErrors({})
  }, [budgetGroup])

  const handleChange = (e) => {
    const { name, value } = e.target
    setErrors((currentErrors) => ({ ...currentErrors, [name]: null }))
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleActiveChange = (e) => {
    setErrors((currentErrors) => ({ ...currentErrors, is_active: null }))
    setForm((currentForm) => ({ ...currentForm, is_active: e.target.checked }))
  }

  const handleReset = () => {
    setForm(emptyForm)
    setErrors({})
    onReset()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})

    const payload = {
      code: form.code.trim().toLowerCase(),
      name: form.name.trim(),
      percentage: Number(form.percentage || 0),
      sort_order: Number(form.sort_order || 0),
      is_active: form.is_active,
    }

    try {
      if (budgetGroup) {
        await api.put(`/budget-groups/${budgetGroup.id}`, payload)
        toastSuccess('Kelompok anggaran diperbarui')
      } else {
        await api.post('/budget-groups', payload)
        toastSuccess('Kelompok anggaran ditambahkan')
      }

      setForm(emptyForm)
      onSaved()
    } catch (err) {
      setErrors(err.validationErrors || {})
    } finally {
      setSaving(false)
    }
  }

  return (
    <CForm onSubmit={handleSubmit}>
      <CFormInput
        label="Kode Kelompok"
        name="code"
        placeholder="Contoh: need, fun, saving"
        maxLength={50}
        value={form.code}
        onChange={handleChange}
        invalid={Boolean(getFieldError(errors, 'code'))}
        feedbackInvalid={getFieldError(errors, 'code')}
        disabled={saving || (budgetGroup && budgetGroup.is_system)}
        className="mb-3"
      />

      <CFormInput
        label="Nama Kelompok"
        name="name"
        placeholder="Contoh: Kebutuhan Pokok"
        maxLength={100}
        value={form.name}
        onChange={handleChange}
        invalid={Boolean(getFieldError(errors, 'name'))}
        feedbackInvalid={getFieldError(errors, 'name')}
        disabled={saving}
        className="mb-3"
      />

      <div className="mb-3">
        <label className="form-label">Persentase Alokasi (%)</label>
        <CInputGroup>
          <CFormInput
            type="number"
            name="percentage"
            min="0"
            max="100"
            step="0.01"
            placeholder="0"
            value={form.percentage}
            onChange={handleChange}
            invalid={Boolean(getFieldError(errors, 'percentage'))}
            disabled={saving}
          />
          <CInputGroupText>%</CInputGroupText>
        </CInputGroup>
        {getFieldError(errors, 'percentage') && (
          <div className="invalid-feedback d-block">{getFieldError(errors, 'percentage')}</div>
        )}
      </div>

      <CFormInput
        type="number"
        label="Urutan Tampilan"
        name="sort_order"
        min="0"
        value={form.sort_order}
        onChange={handleChange}
        invalid={Boolean(getFieldError(errors, 'sort_order'))}
        feedbackInvalid={getFieldError(errors, 'sort_order')}
        disabled={saving}
        className="mb-3"
      />

      <CFormSwitch
        label="Status Aktif"
        name="is_active"
        checked={form.is_active}
        onChange={handleActiveChange}
        disabled={saving}
        className="mb-4"
      />
      {getFieldError(errors, 'is_active') && (
        <div className="invalid-feedback d-block mb-3">{getFieldError(errors, 'is_active')}</div>
      )}

      <CButton type="submit" color="primary" disabled={saving}>
        {saving ? (
          <>
            <CSpinner size="sm" className="me-2" />
            Menyimpan...
          </>
        ) : budgetGroup ? (
          'Update Kelompok'
        ) : (
          'Simpan Kelompok'
        )}
      </CButton>

      <CButton
        type="button"
        color="secondary"
        onClick={handleReset}
        className="ms-2"
        disabled={saving}
      >
        {budgetGroup ? 'Batal' : 'Reset'}
      </CButton>
    </CForm>
  )
}

export default BudgetGroupsForm
