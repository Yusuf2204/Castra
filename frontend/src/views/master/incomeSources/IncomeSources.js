import React, { useCallback, useEffect, useState } from 'react'
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CFormInput,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react'
import { CIcon } from '@coreui/icons-react'
import { cilReload } from '@coreui/icons'
import IncomeSourcesTable from './IncomeSourcesTable'
import IncomeSourcesForm from './IncomeSourcesForm'
import api from '../../../services/api'
import { toastSuccess, toastError } from '../../../services/toastService'

const PER_PAGE = 10

const IncomeSources = () => {
  const [incomeSources, setIncomeSources] = useState([])
  const [selectedIncomeSource, setSelectedIncomeSource] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ search: '', is_active: '' })
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchIncomeSources = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: PER_PAGE }
      if (filters.search) params.search = filters.search
      if (filters.is_active !== '') params.is_active = filters.is_active

      const res = await api.get('/income-sources', { params })

      const payload = res.data?.data
      const rows = Array.isArray(payload) ? payload : payload?.data || []
      const resultMeta = Array.isArray(payload) ? null : payload?.meta || null

      setIncomeSources(rows)
      setMeta(resultMeta)
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  useEffect(() => {
    fetchIncomeSources()
  }, [fetchIncomeSources])

  const handleSearchChange = (e) => {
    setPage(1)
    setFilters((currentFilters) => ({ ...currentFilters, search: e.target.value }))
  }

  const handleStatusChange = (e) => {
    setPage(1)
    setFilters((currentFilters) => ({ ...currentFilters, is_active: e.target.value }))
  }

  const handleSaved = () => {
    setSelectedIncomeSource(null)
    fetchIncomeSources()
  }

  const handleAskDelete = (id) => {
    setDeleteId(id)
    setConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteId) return

    setDeleting(true)
    try {
      await api.delete(`/income-sources/${deleteId}`)
      toastSuccess('Sumber dana dihapus')
      if (incomeSources.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1)
      } else {
        fetchIncomeSources()
      }
    } catch (err) {
      toastError(err.userMessage || 'Gagal menghapus sumber dana')
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
      setDeleteId(null)
    }
  }

  const canPrev = page > 1
  const canNext = meta ? meta.current_page < meta.last_page : false

  return (
    <CRow>
      <CCol md={8}>
        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            Sumber Dana
            <CButton size="sm" color="secondary" title="Muat ulang" onClick={fetchIncomeSources}>
              <CIcon icon={cilReload} />
            </CButton>
          </CCardHeader>
          <CCardBody>
            <CRow className="mb-3 g-2">
              <CCol sm={7}>
                <CFormInput
                  aria-label="Cari sumber dana"
                  placeholder="Cari sumber dana..."
                  value={filters.search}
                  onChange={handleSearchChange}
                />
              </CCol>
              <CCol sm={5}>
                <CFormSelect
                  aria-label="Filter status sumber dana"
                  value={filters.is_active}
                  onChange={handleStatusChange}
                >
                  <option value="">Semua</option>
                  <option value="1">Aktif</option>
                  <option value="0">Nonaktif</option>
                </CFormSelect>
              </CCol>
            </CRow>

            <IncomeSourcesTable
              incomeSources={incomeSources}
              loading={loading}
              onSelect={setSelectedIncomeSource}
              onDelete={handleAskDelete}
            />

            {meta && (
              <div className="d-flex justify-content-between align-items-center mt-3">
                <small className="text-body-secondary">
                  Menampilkan {incomeSources.length} dari {meta.total} data
                </small>
                <div>
                  <CButton
                    size="sm"
                    color="secondary"
                    variant="outline"
                    className="me-2"
                    disabled={!canPrev}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </CButton>
                  <CButton
                    size="sm"
                    color="secondary"
                    variant="outline"
                    disabled={!canNext}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </CButton>
                </div>
              </div>
            )}
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md={4}>
        <CCard>
          <CCardHeader>
            {selectedIncomeSource ? 'Edit Sumber Dana' : 'Tambah Sumber Dana'}
          </CCardHeader>
          <CCardBody>
            <IncomeSourcesForm
              incomeSource={selectedIncomeSource}
              onReset={() => setSelectedIncomeSource(null)}
              onSaved={handleSaved}
            />
          </CCardBody>
        </CCard>
      </CCol>

      <CModal visible={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <CModalHeader>
          <CModalTitle>Hapus Sumber Dana</CModalTitle>
        </CModalHeader>

        <CModalBody>Sumber dana yang dihapus tidak bisa digunakan lagi. Lanjutkan?</CModalBody>

        <CModalFooter>
          <CButton color="secondary" onClick={() => setConfirmOpen(false)}>
            Batal
          </CButton>
          <CButton color="danger" onClick={handleConfirmDelete} disabled={deleting}>
            {deleting ? 'Menghapus...' : 'Hapus'}
          </CButton>
        </CModalFooter>
      </CModal>
    </CRow>
  )
}

export default IncomeSources
