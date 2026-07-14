import React, { useState, useEffect } from 'react'
import { CForm, CFormInput, CButton, CSpinner } from '@coreui/react'
import api from '../../../services/api'
import { useDispatch } from 'react-redux'
import { toastSuccess } from '../../../services/toastService'
import { getFieldError } from '../../../utils/formErrors'

const CompanyForm = ({ company }) => {
  const dispatch = useDispatch()

  const [form, setForm] = useState({
    comp_name: '',
    app_title: '',
    comp_logo: '',
    fav_icon: '',
  })

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  /* ===============================
     SYNC REDUX → FORM
  ============================== */
  useEffect(() => {
    if (!company) return

    setForm({
      comp_name: company.comp_name || '',
      app_title: company.app_title || '',
      comp_logo: company.comp_logo || '',
      fav_icon: company.fav_icon || '',
    })
  }, [company])

  /* ===============================
     INPUT HANDLER
  ============================== */
  const handleChange = (e) => {
    setErrors({ ...errors, [e.target.name]: null })
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  /* ===============================
     SUBMIT
  ============================== */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})

    try {
      const res = await api.put('/company', form)

      // update redux (single source of truth)
      dispatch({
        type: 'set',
        company: res.data.data,
      })

      toastSuccess('Company updated')
    } catch (err) {
      setErrors(err.validationErrors || {})
    } finally {
      setSaving(false)
    }
  }

  /* ===============================
     FILE → BASE64
  ============================== */
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  return (
    <CForm onSubmit={handleSubmit}>
      {/* COMPANY NAME */}
      <CFormInput
        label="Company Name"
        name="comp_name"
        value={form.comp_name}
        onChange={handleChange}
        invalid={Boolean(getFieldError(errors, 'comp_name'))}
        feedbackInvalid={getFieldError(errors, 'comp_name')}
        disabled={saving}
        className="mb-3"
      />

      {/* APP TITLE */}
      <CFormInput
        label="App Title (Browser Tab)"
        name="app_title"
        value={form.app_title}
        onChange={handleChange}
        invalid={Boolean(getFieldError(errors, 'app_title'))}
        feedbackInvalid={getFieldError(errors, 'app_title')}
        disabled={saving}
        className="mb-3"
      />

      {/* LOGO UPLOAD */}
      <CFormInput
        type="file"
        label="Company Logo"
        accept="image/*"
        className="mb-2"
        disabled={saving}
        onChange={async (e) => {
          const file = e.target.files[0]
          if (!file) return

          const base64 = await fileToBase64(file)
          setForm((prev) => ({ ...prev, comp_logo: base64 }))
        }}
      />

      {form.comp_logo && (
        <img src={form.comp_logo} alt="logo preview" style={{ height: 60, marginBottom: 20 }} />
      )}

      <br />

      {/* FAVICON UPLOAD */}
      <CFormInput
        type="file"
        label="Favicon"
        accept="image/*"
        className="mb-2"
        disabled={saving}
        onChange={async (e) => {
          const file = e.target.files[0]
          if (!file) return

          const base64 = await fileToBase64(file)
          setForm((prev) => ({ ...prev, fav_icon: base64 }))
        }}
      />

      {form.fav_icon && (
        <img src={form.fav_icon} alt="favicon preview" style={{ height: 32, marginBottom: 20 }} />
      )}

      {/* BUTTON */}
      <div className="mt-3">
        <CButton type="submit" color="primary" disabled={saving}>
          {saving ? (
            <>
              <CSpinner size="sm" className="me-2" />
              Saving...
            </>
          ) : (
            'Save Company Settings'
          )}
        </CButton>
      </div>
    </CForm>
  )
}

export default CompanyForm
