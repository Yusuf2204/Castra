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
} from '@coreui/react'
import { CIcon } from '@coreui/icons-react'
import { cilPlus, cilPencil, cilTrash, cilReload, cilWallet, cilLoopCircular } from '@coreui/icons'
import AccountsForm from './AccountsForm'
import FundTransferModal from '../../transfers/FundTransferModal'
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

const typeLabels = {
  petty_cash: { label: 'Kas Kecil (Petty Cash)', color: 'warning' },
  bank: { label: 'Rekening Bank', color: 'primary' },
  cash: { label: 'Kas Tunai / Brankas', color: 'success' },
  e_wallet: { label: 'E-Wallet', color: 'info' },
  other: { label: 'Lainnya', color: 'secondary' },
}

const Accounts = () => {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState({ total_balance: 0, petty_cash_balance: 0 })
  const [filters, setFilters] = useState({ search: '', type: '', is_active: '' })

  const [formOpen, setFormOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(null)

  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    try {
      const params = { all: 1 }
      if (filters.search) params.search = filters.search
      if (filters.type) params.type = filters.type
      if (filters.is_active !== '') params.is_active = filters.is_active

      const res = await api.get('/accounts', { params })
      setAccounts(res.data?.data || [])
      setSummary(res.data?.summary || { total_balance: 0, petty_cash_balance: 0 })
    } catch {
      toastError('Gagal memuat daftar akun kas/bank.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const handleEdit = (account) => {
    setSelectedAccount(account)
    setFormOpen(true)
  }

  const handleCreate = () => {
    setSelectedAccount(null)
    setFormOpen(true)
  }

  const handleDeleteClick = (id) => {
    setDeleteId(id)
    setDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await api.delete(`/accounts/${deleteId}`)
      toastSuccess('Akun kas/bank berhasil dihapus.')
      setDeleteModal(false)
      fetchAccounts()
    } catch (err) {
      toastError(err.userMessage || 'Gagal menghapus akun.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {/* Top Banner / Summary Cards */}
      <CRow className="g-3 mb-4">
        <CCol sm={6} lg={4}>
          <CCard className="h-100 shadow-sm border-start border-start-4 border-start-warning">
            <CCardBody className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-body-secondary small mb-1">Saldo Kas Kecil (Petty Cash)</div>
                <div className="fs-4 fw-bold">{formatCurrency(summary.petty_cash_balance)}</div>
              </div>
              <div className="text-warning p-2 rounded-circle bg-warning bg-opacity-10">
                <CIcon icon={cilWallet} size="xl" />
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol sm={6} lg={4}>
          <CCard className="h-100 shadow-sm border-start border-start-4 border-start-primary">
            <CCardBody className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-body-secondary small mb-1">Total Saldo Kas & Bank</div>
                <div className="fs-4 fw-bold text-primary">
                  {formatCurrency(summary.total_balance)}
                </div>
              </div>
              <div className="text-primary p-2 rounded-circle bg-primary bg-opacity-10">
                <CIcon icon={cilWallet} size="xl" />
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={4} className="d-flex align-items-center justify-content-lg-end gap-2">
          <CButton color="primary" onClick={handleCreate}>
            <CIcon icon={cilPlus} className="me-2" />
            Tambah Akun
          </CButton>
          <CButton color="outline-primary" onClick={() => setTransferOpen(true)}>
            <CIcon icon={cilLoopCircular} className="me-2" />
            Mutasi / Top-Up
          </CButton>
        </CCol>
      </CRow>

      {/* Main Card */}
      <CCard className="shadow-sm border-0 mb-4">
        <CCardHeader className="bg-transparent d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <h5 className="mb-0 fw-bold">Master Akun Kas & Bank</h5>
          <div className="d-flex gap-2 flex-wrap">
            <CFormInput
              type="text"
              placeholder="Cari nama akun..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              style={{ width: '200px' }}
            />
            <CFormSelect
              value={filters.type}
              onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
              style={{ width: '160px' }}
            >
              <option value="">Semua Tipe</option>
              <option value="petty_cash">Kas Kecil</option>
              <option value="bank">Bank</option>
              <option value="cash">Kas Tunai</option>
              <option value="e_wallet">E-Wallet</option>
            </CFormSelect>
            <CButton color="secondary" variant="outline" onClick={fetchAccounts} disabled={loading}>
              <CIcon icon={cilReload} />
            </CButton>
          </div>
        </CCardHeader>

        <CCardBody>
          {loading ? (
            <div className="text-center py-5 text-body-secondary">
              <CSpinner size="sm" className="me-2" />
              Memuat data akun kas...
            </div>
          ) : !accounts.length ? (
            <div className="text-center py-5 text-body-secondary">
              Belum ada akun kas/bank yang terdaftar.
            </div>
          ) : (
            <CTable hover responsive align="middle">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Nama Akun</CTableHeaderCell>
                  <CTableHeaderCell>Tipe</CTableHeaderCell>
                  <CTableHeaderCell>No. Rekening</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Saldo Saat Ini</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Plafon Imprest</CTableHeaderCell>
                  <CTableHeaderCell className="text-center">Status</CTableHeaderCell>
                  <CTableHeaderCell width={100} className="text-center">
                    Aksi
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {accounts.map((acc) => {
                  const tMeta = typeLabels[acc.type] || { label: acc.type, color: 'secondary' }
                  return (
                    <CTableRow key={acc.id}>
                      <CTableDataCell>
                        <strong>{acc.name}</strong>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={tMeta.color} variant="outline">
                          {tMeta.label}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell className="text-body-secondary small">
                        {acc.account_number || '-'}
                      </CTableDataCell>
                      <CTableDataCell className="text-end fw-bold">
                        {formatCurrency(acc.current_balance)}
                      </CTableDataCell>
                      <CTableDataCell className="text-end text-body-secondary small">
                        {acc.imprest_limit ? formatCurrency(acc.imprest_limit) : '-'}
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        {acc.is_active ? (
                          <CBadge color="success">Aktif</CBadge>
                        ) : (
                          <CBadge color="secondary">Non-aktif</CBadge>
                        )}
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        <CButton
                          size="sm"
                          color="secondary"
                          variant="ghost"
                          title="Edit"
                          className="me-1"
                          onClick={() => handleEdit(acc)}
                        >
                          <CIcon icon={cilPencil} />
                        </CButton>
                        <CButton
                          size="sm"
                          color="danger"
                          variant="ghost"
                          title="Hapus"
                          onClick={() => handleDeleteClick(acc.id)}
                        >
                          <CIcon icon={cilTrash} />
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  )
                })}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {/* Form Modal */}
      <AccountsForm
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        account={selectedAccount}
        onSaved={fetchAccounts}
      />

      {/* Transfer Modal */}
      <FundTransferModal
        visible={transferOpen}
        onClose={() => setTransferOpen(false)}
        onSaved={fetchAccounts}
      />

      {/* Delete Confirmation Modal */}
      <CModal visible={deleteModal} onClose={() => setDeleteModal(false)}>
        <CModalHeader closeButton>
          <CModalTitle>Konfirmasi Hapus Akun</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Apakah Anda yakin ingin menghapus akun ini? Akun yang sudah memiliki mutasi/transaksi
          tidak dapat dihapus.
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            variant="outline"
            onClick={() => setDeleteModal(false)}
            disabled={deleting}
          >
            Batal
          </CButton>
          <CButton color="danger" onClick={handleConfirmDelete} disabled={deleting}>
            {deleting ? 'Menghapus...' : 'Ya, Hapus'}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Accounts
