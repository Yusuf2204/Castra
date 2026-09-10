import React, { useEffect, useState } from 'react'
import { CForm, CFormInput, CFormTextarea, CFormSwitch, CButton, CSpinner } from '@coreui/react'
import api from '../../../services/api'
import { toastSuccess } from '../../../services/toastService'
import { getFieldError } from '../../../utils/formErrors'

const emptyForm = {
  name: '',
  description: '',
  is_active: true,
}

const IncomeSourcesForm = ({ incomeSource, onReset, onSaved }) => {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (incomeSource) {
      setForm({
        name: incomeSource.name || '',
        description: incomeSource.description || '',
        is_active: Boolean(incomeSource.is_active),
      })
    } else {
      setForm(emptyForm)
    }

    setErrors({})
  }, [incomeSource])

  const handleChange = (e) => {
    setErrors((currentErrors) => ({ ...currentErrors, [e.target.name]: null }))
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleActiveChange = (e) => {
    setErrors((currentErrors) => ({ ...currentErrors, is_active: null }))
    setForm({ ...form, is_active: e.target.checked })
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
      name: form.name,
      description: form.description || null,
      is_active: form.is_active,
    }

    try {
      if (incomeSource) {
        await api.put(`/income-sources/${incomeSource.id}`, payload)
        toastSuccess('Sumber dana diperbarui')
      } else {
        await api.post('/income-sources', payload)
        toastSuccess('Sumber dana ditambahkan')
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
        label="Nama"
        name="name"
        maxLength={100}
        value={form.name}
        onChange={handleChange}
        invalid={Boolean(getFieldError(errors, 'name'))}
        feedbackInvalid={getFieldError(errors, 'name')}
        disabled={saving}
        className="mb-3"
      />

      <CFormTextarea
        label="Deskripsi"
        name="description"
        rows={3}
        maxLength={1000}
        value={form.description}
        onChange={handleChange}
        invalid={Boolean(getFieldError(errors, 'description'))}
        feedbackInvalid={getFieldError(errors, 'description')}
        disabled={saving}
        className="mb-3"
      />

      <CFormSwitch
        label="Aktif"
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
            {incomeSource ? 'Menyimpan...' : 'Menyimpan...'}
          </>
        ) : incomeSource ? (
          'Update'
        ) : (
          'Simpan'
        )}
      </CButton>

      <CButton
        type="button"
        color="secondary"
        onClick={handleReset}
        className="ms-2"
        disabled={saving}
      >
        Reset
      </CButton>
    </CForm>
  )
}

export default IncomeSourcesForm
