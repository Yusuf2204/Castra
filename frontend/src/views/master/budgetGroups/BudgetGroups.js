import React, { useCallback, useEffect, useState } from 'react'
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react'
import { CIcon } from '@coreui/icons-react'
import { cilReload } from '@coreui/icons'
import BudgetGroupsTable from './BudgetGroupsTable'
import BudgetGroupsForm from './BudgetGroupsForm'
import api from '../../../services/api'
import { toastSuccess, toastError } from '../../../services/toastService'

const BudgetGroups = () => {
  const [budgetGroups, setBudgetGroups] = useState([])
  const [selectedBudgetGroup, setSelectedBudgetGroup] = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchBudgetGroups = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/budget-groups')
      const payload = res.data?.data
      setBudgetGroups(Array.isArray(payload) ? payload : [])
    } catch (err) {
      toastError(err.userMessage || 'Gagal memuat kelompok anggaran')
      setBudgetGroups([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBudgetGroups()
  }, [fetchBudgetGroups])

  const handleSaved = () => {
    setSelectedBudgetGroup(null)
    fetchBudgetGroups()
  }

  const handleAskDelete = (id) => {
    setDeleteId(id)
    setConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteId) return

    setDeleting(true)
    try {
      await api.delete(`/budget-groups/${deleteId}`)
      toastSuccess('Kelompok anggaran berhasil dihapus')
      fetchBudgetGroups()
    } catch (err) {
      toastError(err.userMessage || 'Gagal menghapus kelompok anggaran')
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
      setDeleteId(null)
    }
  }

  const totalPercentage = budgetGroups
    .filter((bg) => bg.is_active)
    .reduce((sum, bg) => sum + Number(bg.percentage || 0), 0)

  return (
    <CRow>
      <CCol md={8}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <div>
              <span className="fw-semibold">Kelompok Anggaran</span>
              <small className="text-body-secondary ms-2">
                (Total Alokasi Aktif: {totalPercentage}%)
              </small>
            </div>
            <CButton size="sm" color="secondary" title="Muat ulang" onClick={fetchBudgetGroups}>
              <CIcon icon={cilReload} />
            </CButton>
          </CCardHeader>

          <CCardBody>
            <BudgetGroupsTable
              budgetGroups={budgetGroups}
              loading={loading}
              onSelect={setSelectedBudgetGroup}
              onDelete={handleAskDelete}
            />
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md={4}>
        <CCard>
          <CCardHeader>
            {selectedBudgetGroup ? 'Edit Kelompok Anggaran' : 'Tambah Kelompok Anggaran'}
          </CCardHeader>
          <CCardBody>
            <BudgetGroupsForm
              budgetGroup={selectedBudgetGroup}
              onReset={() => setSelectedBudgetGroup(null)}
              onSaved={handleSaved}
            />
          </CCardBody>
        </CCard>
      </CCol>

      <CModal visible={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <CModalHeader>
          <CModalTitle>Hapus Kelompok Anggaran</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Kelompok anggaran yang masih digunakan oleh kategori tidak dapat dihapus. Lanjutkan?
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

export default BudgetGroups
