import React, { useCallback, useEffect, useState } from 'react'
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CButtonGroup,
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
import CategoriesTable from './CategoriesTable'
import CategoriesForm from './CategoriesForm'
import api from '../../../services/api'
import { toastSuccess, toastError } from '../../../services/toastService'

const PER_PAGE = 10

const Categories = () => {
  const [activeTab, setActiveTab] = useState('expense') // 'expense' | 'income'
  const [categories, setCategories] = useState([])
  const [budgetGroups, setBudgetGroups] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ search: '', is_active: '' })
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch Budget Groups once (for expense category form dropdown)
  const fetchBudgetGroups = useCallback(async () => {
    try {
      const res = await api.get('/budget-groups')
      const payload = res.data?.data
      setBudgetGroups(Array.isArray(payload) ? payload : [])
    } catch {
      setBudgetGroups([])
    }
  }, [])

  useEffect(() => {
    fetchBudgetGroups()
  }, [fetchBudgetGroups])

  // Fetch Categories based on activeTab, filters, and page
  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        type: activeTab,
        page,
        per_page: PER_PAGE,
      }
      if (filters.search) params.search = filters.search
      if (filters.is_active !== '') params.is_active = filters.is_active

      const res = await api.get('/categories', { params })
      const payload = res.data?.data
      const rows = Array.isArray(payload) ? payload : payload?.data || []
      const resultMeta = Array.isArray(payload) ? null : payload?.meta || null

      setCategories(rows)
      setMeta(resultMeta)
    } finally {
      setLoading(false)
    }
  }, [activeTab, page, filters])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleTabChange = (type) => {
    if (activeTab === type) return
    setActiveTab(type)
    setSelectedCategory(null)
    setPage(1)
    setFilters({ search: '', is_active: '' })
  }

  const handleSearchChange = (e) => {
    setPage(1)
    setFilters((currentFilters) => ({ ...currentFilters, search: e.target.value }))
  }

  const handleStatusChange = (e) => {
    setPage(1)
    setFilters((currentFilters) => ({ ...currentFilters, is_active: e.target.value }))
  }

  const handleSaved = () => {
    setSelectedCategory(null)
    fetchCategories()
  }

  const handleAskDelete = (id) => {
    setDeleteId(id)
    setConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteId) return

    setDeleting(true)
    try {
      await api.delete(`/categories/${deleteId}`)
      toastSuccess('Kategori berhasil dihapus')
      if (categories.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1)
      } else {
        fetchCategories()
      }
    } catch (err) {
      toastError(err.userMessage || 'Gagal menghapus kategori')
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
      setDeleteId(null)
    }
  }

  const canPrev = page > 1
  const canNext = meta ? meta.current_page < meta.last_page : false
  const tabLabel = activeTab === 'expense' ? 'Pengeluaran' : 'Pemasukan'

  return (
    <CRow>
      <CCol md={8}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <span className="fw-semibold">Master Kategori</span>
              <CButtonGroup size="sm" className="ms-3" role="group">
                <CButton
                  color={activeTab === 'expense' ? 'primary' : 'outline-secondary'}
                  onClick={() => handleTabChange('expense')}
                >
                  Pengeluaran
                </CButton>
                <CButton
                  color={activeTab === 'income' ? 'primary' : 'outline-secondary'}
                  onClick={() => handleTabChange('income')}
                >
                  Pemasukan
                </CButton>
              </CButtonGroup>
            </div>
            <CButton size="sm" color="secondary" title="Muat ulang" onClick={fetchCategories}>
              <CIcon icon={cilReload} />
            </CButton>
          </CCardHeader>

          <CCardBody>
            <CRow className="mb-3 g-2">
              <CCol sm={7}>
                <CFormInput
                  aria-label={`Cari kategori ${tabLabel}`}
                  placeholder={`Cari kategori ${tabLabel}...`}
                  value={filters.search}
                  onChange={handleSearchChange}
                />
              </CCol>
              <CCol sm={5}>
                <CFormSelect
                  aria-label="Filter status kategori"
                  value={filters.is_active}
                  onChange={handleStatusChange}
                >
                  <option value="">Semua Status</option>
                  <option value="1">Aktif</option>
                  <option value="0">Nonaktif</option>
                </CFormSelect>
              </CCol>
            </CRow>

            <CategoriesTable
              categories={categories}
              loading={loading}
              type={activeTab}
              onSelect={setSelectedCategory}
              onDelete={handleAskDelete}
            />

            {meta && (
              <div className="d-flex justify-content-between align-items-center mt-3">
                <small className="text-body-secondary">
                  Menampilkan {categories.length} dari {meta.total} data
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
            {selectedCategory ? `Edit Kategori ${tabLabel}` : `Tambah Kategori ${tabLabel}`}
          </CCardHeader>
          <CCardBody>
            <CategoriesForm
              category={selectedCategory}
              type={activeTab}
              budgetGroups={budgetGroups}
              onReset={() => setSelectedCategory(null)}
              onSaved={handleSaved}
            />
          </CCardBody>
        </CCard>
      </CCol>

      <CModal visible={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <CModalHeader>
          <CModalTitle>Hapus Kategori</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Kategori yang sudah dihapus tidak dapat dipulihkan. Apakah Anda yakin ingin menghapus
          kategori ini?
        </CModalBody>
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

export default Categories
