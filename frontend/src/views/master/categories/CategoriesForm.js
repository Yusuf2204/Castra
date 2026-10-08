import React, { useEffect, useState } from 'react'
import {
  CForm,
  CFormInput,
  CFormSelect,
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
  name: '',
  budget_group_id: '',
  monthly_estimate: '0',
  is_active: true,
}

const CategoriesForm = ({ category, type, budgetGroups = [], onReset, onSaved }) => {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name || '',
        budget_group_id: category.budget_group_id || '',
        monthly_estimate:
          category.monthly_estimate != null ? String(category.monthly_estimate) : '0',
        is_active: Boolean(category.is_active),
      })
    } else {
      setForm(emptyForm)
    }
    setErrors({})
  }, [category, type])

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
      name: form.name.trim(),
      type,
      is_active: form.is_active,
    }

    const parseAmount = (val) => (typeof val === 'string' ? Number(val.replace(',', '.')) : Number(val))

    if (type === 'expense') {
      payload.budget_group_id = form.budget_group_id ? Number(form.budget_group_id) : null
      payload.monthly_estimate = parseAmount(form.monthly_estimate || 0)
    }

    try {
      if (category) {
        await api.put(`/categories/${category.id}`, payload)
        toastSuccess('Kategori berhasil diperbarui')
      } else {
        await api.post('/categories', payload)
        toastSuccess('Kategori berhasil ditambahkan')
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
        label="Nama Kategori"
        name="name"
        placeholder="Contoh: Makan Siang, Bensin..."
        maxLength={100}
        value={form.name}
        onChange={handleChange}
        invalid={Boolean(getFieldError(errors, 'name'))}
        feedbackInvalid={getFieldError(errors, 'name')}
        disabled={saving}
        className="mb-3"
      />

      {type === 'expense' && (
        <>
          <CFormSelect
            label="Kelompok Anggaran"
            name="budget_group_id"
            value={form.budget_group_id}
            onChange={handleChange}
            invalid={Boolean(getFieldError(errors, 'budget_group_id'))}
            feedbackInvalid={getFieldError(errors, 'budget_group_id')}
            disabled={saving}
            className="mb-3"
          >
            <option value="">-- Pilih Kelompok Anggaran --</option>
            {budgetGroups.map((bg) => (
              <option key={bg.id} value={bg.id}>
                {bg.name} ({bg.percentage}%)
              </option>
            ))}
          </CFormSelect>

          <div className="mb-3">
            <label className="form-label">
              Estimasi Default Bulanan (Baseline)
              <small className="text-body-secondary d-block">
                Plafon acuan awal saat membuat siklus anggaran baru
              </small>
            </label>
            <CInputGroup>
              <CInputGroupText>Rp</CInputGroupText>
              <CFormInput
                type="number"
                name="monthly_estimate"
                min="0"
                step="any"
                placeholder="0"
                value={form.monthly_estimate}
                onChange={handleChange}
                invalid={Boolean(getFieldError(errors, 'monthly_estimate'))}
                disabled={saving}
              />
            </CInputGroup>
            {getFieldError(errors, 'monthly_estimate') && (
              <div className="invalid-feedback d-block">
                {getFieldError(errors, 'monthly_estimate')}
              </div>
            )}
          </div>
        </>
      )}

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
        ) : category ? (
          'Update Kategori'
        ) : (
          'Simpan Kategori'
        )}
      </CButton>

      <CButton
        type="button"
        color="secondary"
        onClick={handleReset}
        className="ms-2"
        disabled={saving}
      >
        {category ? 'Batal' : 'Reset'}
      </CButton>
    </CForm>
  )
}

export default CategoriesForm
