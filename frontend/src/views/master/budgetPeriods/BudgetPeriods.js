import React, { useCallback, useEffect, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CForm,
  CFormInput,
  CFormTextarea,
  CFormSwitch,
  CInputGroup,
  CInputGroupText,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CSpinner,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilReload,
  cilPlus,
  cilPencil,
  cilTrash,
  cilCheckCircle,
  cilCalendar,
  cilMoney,
  cilWarning,
} from '@coreui/icons'
import api from '../../../services/api'
import { toastSuccess, toastError } from '../../../services/toastService'

const formatCurrency = (val) => {
  if (val === null || val === undefined || val === '') return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(val))
}

const formatDateShort = (val) => {
  if (!val) return '-'
  return new Date(val).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const BudgetPeriods = () => {
  const [periods, setPeriods] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState(null)

  // Form modal create/edit period
  const [periodModalOpen, setPeriodModalOpen] = useState(false)
  const [savingPeriod, setSavingPeriod] = useState(false)
  const [editingPeriodId, setEditingPeriodId] = useState(null)
  const [periodForm, setPeriodForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    total_income_allocated: '',
    is_active: true,
    notes: '',
  })

  // Modal allocations editor
  const [allocationsModalOpen, setAllocationsModalOpen] = useState(false)
  const [allocationsList, setAllocationsList] = useState([])
  const [savingAllocations, setSavingAllocations] = useState(false)

  // Delete modal
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchPeriods = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/budget-periods')
      const payload = res.data?.data || []
      setPeriods(payload)
      setSelectedPeriod((prevSelected) => {
        if (!prevSelected) {
          return payload.find((p) => p.is_active) || payload[0] || null
        }
        return payload.find((p) => p.id === prevSelected.id) || payload[0] || null
      })
    } catch (err) {
      toastError(err.userMessage || 'Gagal memuat siklus anggaran')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPeriods()
  }, [fetchPeriods])

  const handleOpenCreatePeriod = () => {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')

    // Default start date = 5th of this month, end date = 4th of next month
    const startStr = `${y}-${m}-05`
    const nextMonth = new Date(y, today.getMonth() + 1, 4)
    const nextY = nextMonth.getFullYear()
    const nextM = String(nextMonth.getMonth() + 1).padStart(2, '0')
    const endStr = `${nextY}-${nextM}-04`

    setEditingPeriodId(null)
    setPeriodForm({
      name: `Siklus ${formatDateShort(startStr)} - ${formatDateShort(endStr)}`,
      start_date: startStr,
      end_date: endStr,
      total_income_allocated: '',
      is_active: true,
      notes: '',
    })
    setPeriodModalOpen(true)
  }

  const handleOpenEditPeriod = (period) => {
    setEditingPeriodId(period.id)
    setPeriodForm({
      name: period.name || '',
      start_date: period.start_date || '',
      end_date: period.end_date || '',
      total_income_allocated: period.total_income_allocated != null ? String(period.total_income_allocated) : '',
      is_active: Boolean(period.is_active),
      notes: period.notes || '',
    })
    setPeriodModalOpen(true)
  }

  const handleSavePeriod = async (e) => {
    e.preventDefault()
    setSavingPeriod(true)
    try {
      const payload = {
        name: periodForm.name,
        start_date: periodForm.start_date,
        end_date: periodForm.end_date,
        total_income_allocated: Number(periodForm.total_income_allocated || 0),
        is_active: periodForm.is_active,
        notes: periodForm.notes,
      }

      if (editingPeriodId) {
        await api.put(`/budget-periods/${editingPeriodId}`, payload)
        toastSuccess('Siklus anggaran berhasil diperbarui')
      } else {
        await api.post('/budget-periods', payload)
        toastSuccess('Siklus anggaran baru berhasil dibuat')
      }

      setPeriodModalOpen(false)
      fetchPeriods()
    } catch (err) {
      toastError(err.userMessage || 'Gagal menyimpan siklus anggaran')
    } finally {
      setSavingPeriod(false)
    }
  }

  const handleOpenAllocations = async (period) => {
    setSelectedPeriod(period)
    try {
      const res = await api.get(`/budget-periods/${period.id}/allocations`)
      const list = res.data?.data || []
      setAllocationsList(list.map((item) => ({ ...item })))
      setAllocationsModalOpen(true)
    } catch (err) {
      toastError(err.userMessage || 'Gagal memuat alokasi kategori')
    }
  }

  const handleAllocationAmountChange = (index, val) => {
    const updated = [...allocationsList]
    updated[index].allocated_amount = Number(val || 0)
    setAllocationsList(updated)
  }

  const handleSaveAllocations = async () => {
    if (!selectedPeriod) return
    setSavingAllocations(true)
    try {
      const payload = {
        allocations: allocationsList.map((a) => ({
          category_id: a.category_id,
          allocated_amount: Number(a.allocated_amount || 0),
          notes: a.notes || null,
        })),
      }
      await api.put(`/budget-periods/${selectedPeriod.id}/allocations`, payload)
      toastSuccess('Alokasi anggaran kategori berhasil disimpan')
      setAllocationsModalOpen(false)
      fetchPeriods()
    } catch (err) {
      toastError(err.userMessage || 'Gagal menyimpan alokasi anggaran')
    } finally {
      setSavingAllocations(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await api.delete(`/budget-periods/${deleteId}`)
      toastSuccess('Siklus anggaran berhasil dihapus')
      setDeleteId(null)
      fetchPeriods()
    } catch (err) {
      toastError(err.userMessage || 'Gagal menghapus siklus anggaran')
    } finally {
      setDeleting(false)
    }
  }

  const totalAllocatedInModal = allocationsList.reduce(
    (sum, a) => sum + Number(a.allocated_amount || 0),
    0
  )
  const incomeAllocated = selectedPeriod?.total_income_allocated || 0
  const unallocatedDifference = incomeAllocated - totalAllocatedInModal

  return (
    <div>
      {/* Top Banner Notice */}
      <CAlert color="info" className="d-flex align-items-center mb-4 shadow-sm">
        <CIcon icon={cilCalendar} className="flex-shrink-0 me-3" size="xl" />
        <div>
          <div className="fw-bold">Konsep Anggaran Berbasis Siklus Gajian (Pay Period)</div>
          <small>
            Tanggal gajian Anda bisa bergeser setiap bulannya. Tentukan rentang tanggal siklus di sini dan sesuaikan batas nominal estimasi pengeluaran per kategori secara fleksibel mengikuti penghasilan utama Anda.
          </small>
        </div>
      </CAlert>

      <CRow className="g-4">
        {/* Kolom Kiri: Tabel Daftar Siklus */}
        <CCol lg={7}>
          <CCard className="shadow-sm h-100">
            <CCardHeader className="d-flex justify-content-between align-items-center bg-transparent py-3">
              <span className="fw-semibold">Daftar Siklus Anggaran</span>
              <div className="d-flex gap-2">
                <CButton size="sm" color="secondary" variant="outline" onClick={fetchPeriods} title="Muat Ulang">
                  <CIcon icon={cilReload} />
                </CButton>
                <CButton size="sm" color="primary" onClick={handleOpenCreatePeriod}>
                  <CIcon icon={cilPlus} className="me-1" />
                  Siklus Baru
                </CButton>
              </div>
            </CCardHeader>

            <CCardBody>
              {loading ? (
                <div className="text-center py-4 text-body-secondary">
                  <CSpinner size="sm" className="me-2" />
                  Memuat siklus anggaran...
                </div>
              ) : periods.length === 0 ? (
                <div className="text-center py-5 text-body-secondary">
                  Belum ada siklus anggaran. Klik tombol <strong>Siklus Baru</strong> untuk memulai.
                </div>
              ) : (
                <CTable hover responsive align="middle">
                  <CTableHead className="table-light">
                    <CTableRow>
                      <CTableHeaderCell>Nama & Rentang</CTableHeaderCell>
                      <CTableHeaderCell>Gaji Dialokasikan</CTableHeaderCell>
                      <CTableHeaderCell>Total Pagu</CTableHeaderCell>
                      <CTableHeaderCell>Status</CTableHeaderCell>
                      <CTableHeaderCell className="text-end">Aksi</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {periods.map((p) => {
                      const isSelected = selectedPeriod?.id === p.id
                      return (
                        <CTableRow
                          key={p.id}
                          className={isSelected ? 'table-primary bg-opacity-25' : ''}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedPeriod(p)}
                        >
                          <CTableDataCell>
                            <div className="fw-bold">{p.name}</div>
                            <small className="text-body-secondary">
                              {formatDateShort(p.start_date)} s/d {formatDateShort(p.end_date)}
                            </small>
                          </CTableDataCell>
                          <CTableDataCell>
                            {formatCurrency(p.total_income_allocated)}
                          </CTableDataCell>
                          <CTableDataCell>
                            <span className="fw-semibold">{formatCurrency(p.total_allocated)}</span>
                          </CTableDataCell>
                          <CTableDataCell>
                            {p.is_active ? (
                              <CBadge color="success">Aktif</CBadge>
                            ) : (
                              <CBadge color="secondary">Arsip</CBadge>
                            )}
                          </CTableDataCell>
                          <CTableDataCell className="text-end" onClick={(e) => e.stopPropagation()}>
                            <div className="btn-group btn-group-sm">
                              <CButton
                                color="info"
                                variant="ghost"
                                title="Atur Pagu Kategori"
                                onClick={() => handleOpenAllocations(p)}
                              >
                                <CIcon icon={cilMoney} />
                              </CButton>
                              <CButton
                                color="primary"
                                variant="ghost"
                                title="Ubah Periode / Tanggal"
                                onClick={() => handleOpenEditPeriod(p)}
                              >
                                <CIcon icon={cilPencil} />
                              </CButton>
                              <CButton
                                color="danger"
                                variant="ghost"
                                title="Hapus"
                                onClick={() => setDeleteId(p.id)}
                              >
                                <CIcon icon={cilTrash} />
                              </CButton>
                            </div>
                          </CTableDataCell>
                        </CTableRow>
                      )
                    })}
                  </CTableBody>
                </CTable>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        {/* Kolom Kanan: Rincian Pagu Siklus yang Dipilih */}
        <CCol lg={5}>
          <CCard className="shadow-sm h-100">
            <CCardHeader className="bg-transparent py-3 d-flex justify-content-between align-items-center">
              <div>
                <span className="fw-semibold">Pagu Kategori Terpilih</span>
                {selectedPeriod && (
                  <div className="small text-body-secondary">
                    {selectedPeriod.name} ({formatDateShort(selectedPeriod.start_date)} - {formatDateShort(selectedPeriod.end_date)})
                  </div>
                )}
              </div>
              {selectedPeriod && (
                <CButton
                  size="sm"
                  color="primary"
                  variant="outline"
                  onClick={() => handleOpenAllocations(selectedPeriod)}
                >
                  <CIcon icon={cilPencil} className="me-1" />
                  Sesuaikan Pagu
                </CButton>
              )}
            </CCardHeader>

            <CCardBody>
              {!selectedPeriod ? (
                <div className="text-center py-5 text-body-secondary">
                  Pilih salah satu siklus di sebelah kiri untuk melihat rincian pagu kategori.
                </div>
              ) : (
                <div>
                  <div className="p-3 bg-body-tertiary border rounded mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="small text-body-secondary">Gaji/Pemasukan Pokok:</span>
                      <span className="fw-bold text-body">{formatCurrency(selectedPeriod.total_income_allocated)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="small text-body-secondary">Total Pagu Kategori:</span>
                      <span className="fw-bold text-primary">{formatCurrency(selectedPeriod.total_allocated)}</span>
                    </div>
                    <div className="d-flex justify-content-between pt-1 border-top">
                      <span className="small text-body-secondary">Sisa Cadangan / Belum Terbagi:</span>
                      <span
                        className={`fw-bold ${
                          selectedPeriod.total_income_allocated - selectedPeriod.total_allocated < 0
                            ? 'text-danger'
                            : 'text-success'
                        }`}
                      >
                        {formatCurrency(selectedPeriod.total_income_allocated - selectedPeriod.total_allocated)}
                      </span>
                    </div>
                  </div>

                  <CTable hover responsive small align="middle">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Kategori</CTableHeaderCell>
                        <CTableHeaderCell>Grup</CTableHeaderCell>
                        <CTableHeaderCell className="text-end">Pagu Siklus</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {selectedPeriod.allocations && selectedPeriod.allocations.length > 0 ? (
                        selectedPeriod.allocations.map((a) => (
                          <CTableRow key={a.id}>
                            <CTableDataCell>
                              <div className="fw-semibold text-body">{a.category_name}</div>
                              {a.baseline_estimate !== a.allocated_amount && (
                                <small className="text-body-secondary d-block">
                                  Default: {formatCurrency(a.baseline_estimate)}
                                </small>
                              )}
                            </CTableDataCell>
                            <CTableDataCell>
                              <small className="badge bg-secondary">
                                {a.budget_group?.name || '-'}
                              </small>
                            </CTableDataCell>
                            <CTableDataCell className="text-end fw-bold">
                              {formatCurrency(a.allocated_amount)}
                            </CTableDataCell>
                          </CTableRow>
                        ))
                      ) : (
                        <CTableRow>
                          <CTableDataCell colSpan={3} className="text-center py-3 text-body-secondary">
                            Belum ada alokasi kategori untuk siklus ini.
                          </CTableDataCell>
                        </CTableRow>
                      )}
                    </CTableBody>
                  </CTable>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Modal Buat / Edit Siklus */}
      <CModal visible={periodModalOpen} onClose={() => setPeriodModalOpen(false)}>
        <CModalHeader>
          <CModalTitle>{editingPeriodId ? 'Ubah Siklus Anggaran' : 'Buat Siklus Anggaran Baru'}</CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSavePeriod}>
          <CModalBody>
            <div className="mb-3">
              <label className="form-label fw-semibold">Nama Siklus</label>
              <CFormInput
                required
                value={periodForm.name}
                onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
                placeholder="Contoh: Siklus 5 Okt - 4 Nov 2026"
              />
            </div>

            <CRow className="g-3 mb-3">
              <CCol md={6}>
                <label className="form-label fw-semibold">Tanggal Mulai (Gajian)</label>
                <CFormInput
                  type="date"
                  required
                  value={periodForm.start_date}
                  onChange={(e) => setPeriodForm({ ...periodForm, start_date: e.target.value })}
                />
              </CCol>
              <CCol md={6}>
                <label className="form-label fw-semibold">Tanggal Selesai (Cut-Off)</label>
                <CFormInput
                  type="date"
                  required
                  value={periodForm.end_date}
                  onChange={(e) => setPeriodForm({ ...periodForm, end_date: e.target.value })}
                />
                <small className="text-body-secondary d-block mt-1">
                  Bisa diubah jika gajian berikutnya mundur
                </small>
              </CCol>
            </CRow>

            <div className="mb-3">
              <label className="form-label fw-semibold">Gaji Pokok / Pemasukan yang Dialokasikan</label>
              <CInputGroup>
                <CInputGroupText>Rp</CInputGroupText>
                <CFormInput
                  type="number"
                  min="0"
                  placeholder="0"
                  value={periodForm.total_income_allocated}
                  onChange={(e) => setPeriodForm({ ...periodForm, total_income_allocated: e.target.value })}
                />
              </CInputGroup>
            </div>

            <div className="mb-3">
              <label className="form-label">Catatan Tambahan</label>
              <CFormTextarea
                rows={2}
                value={periodForm.notes}
                onChange={(e) => setPeriodForm({ ...periodForm, notes: e.target.value })}
                placeholder="Contoh: Gaji mundur 2 hari karena akhir pekan"
              />
            </div>

            <CFormSwitch
              label="Jadikan Siklus Aktif Saat Ini"
              checked={periodForm.is_active}
              onChange={(e) => setPeriodForm({ ...periodForm, is_active: e.target.checked })}
            />
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" variant="ghost" onClick={() => setPeriodModalOpen(false)}>
              Batal
            </CButton>
            <CButton color="primary" type="submit" disabled={savingPeriod}>
              {savingPeriod ? <CSpinner size="sm" /> : 'Simpan Siklus'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>

      {/* Modal Edit Alokasi Pagu Kategori */}
      <CModal size="lg" visible={allocationsModalOpen} onClose={() => setAllocationsModalOpen(false)}>
        <CModalHeader>
          <CModalTitle>
            Penyesuaian Pagu Kategori: {selectedPeriod?.name}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="p-3 bg-body-tertiary border rounded mb-3 d-flex justify-content-between align-items-center">
            <div>
              <span className="small text-body-secondary d-block">Target Gaji:</span>
              <strong className="fs-6 text-body">{formatCurrency(incomeAllocated)}</strong>
            </div>
            <div>
              <span className="small text-body-secondary d-block">Total Pagu Terbagi:</span>
              <strong className="fs-6 text-primary">{formatCurrency(totalAllocatedInModal)}</strong>
            </div>
            <div>
              <span className="small text-body-secondary d-block">Sisa / Selisih:</span>
              <strong className={`fs-6 ${unallocatedDifference < 0 ? 'text-danger' : 'text-success'}`}>
                {formatCurrency(unallocatedDifference)}
              </strong>
            </div>
          </div>

          <CTable hover responsive align="middle">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Nama Kategori</CTableHeaderCell>
                <CTableHeaderCell>Kelompok Amplop</CTableHeaderCell>
                <CTableHeaderCell>Default Baseline</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '220px' }}>Pagu Siklus Ini</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {allocationsList.map((item, idx) => (
                <CTableRow key={item.id || item.category_id}>
                  <CTableDataCell className="fw-semibold text-body">
                    {item.category_name}
                  </CTableDataCell>
                  <CTableDataCell>
                    <small className="badge bg-secondary">
                      {item.budget_group?.name || '-'}
                    </small>
                  </CTableDataCell>
                  <CTableDataCell className="text-body-secondary">
                    {formatCurrency(item.baseline_estimate)}
                  </CTableDataCell>
                  <CTableDataCell>
                    <CInputGroup size="sm">
                      <CInputGroupText>Rp</CInputGroupText>
                      <CFormInput
                        type="number"
                        min="0"
                        value={item.allocated_amount}
                        onChange={(e) => handleAllocationAmountChange(idx, e.target.value)}
                      />
                    </CInputGroup>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={() => setAllocationsModalOpen(false)}>
            Batal
          </CButton>
          <CButton color="primary" onClick={handleSaveAllocations} disabled={savingAllocations}>
            {savingAllocations ? <CSpinner size="sm" /> : 'Simpan Perubahan Pagu'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Modal Hapus */}
      <CModal visible={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <CModalHeader>
          <CModalTitle>Konfirmasi Hapus Siklus</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Apakah Anda yakin ingin menghapus siklus anggaran ini beserta seluruh data alokasi kategorinya?
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={() => setDeleteId(null)}>
            Batal
          </CButton>
          <CButton color="danger" onClick={handleConfirmDelete} disabled={deleting}>
            {deleting ? <CSpinner size="sm" /> : 'Hapus'}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default BudgetPeriods

