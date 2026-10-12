import React, { useCallback, useEffect, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CButtonGroup,
  CRow,
  CCol,
  CFormInput,
  CFormSelect,
  CBadge,
} from '@coreui/react'
import { CIcon } from '@coreui/icons-react'
import {
  cilCalendar,
  cilList,
  cilPlus,
  cilChevronLeft,
  cilChevronRight,
  cilReload,
} from '@coreui/icons'
import ExpenseCalendar from './ExpenseCalendar'
import ExpensesTable from './ExpensesTable'
import ExpenseModal from './ExpenseModal'
import api from '../../services/api'
import { toastError, toastSuccess } from '../../services/toastService'

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

const formatCurrency = (val) => {
  if (val === null || val === undefined || val === '') return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(val))
}

const Expenses = () => {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [viewMode, setViewMode] = useState('calendar') // 'calendar' | 'table'

  // Master options
  const [categories, setCategories] = useState([])
  const [budgetGroups, setBudgetGroups] = useState([])

  // Calendar State
  const [calendarData, setCalendarData] = useState({
    total_month: 0,
    transaction_count: 0,
    days: {},
  })
  const [loadingCalendar, setLoadingCalendar] = useState(false)

  // Table State
  const [tableData, setTableData] = useState([])
  const [tableMeta, setTableMeta] = useState(null)
  const [loadingTable, setLoadingTable] = useState(false)
  const [tablePage, setTablePage] = useState(1)
  const [filters, setFilters] = useState({
    search: '',
    category_id: '',
    budget_group_id: '',
  })

  // Modal State
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')

  const monthStr = `${year}-${String(month).padStart(2, '0')}`

  // Fetch Master Data for dropdowns
  const fetchMasters = useCallback(async () => {
    try {
      const [categoriesRes, budgetGroupsRes] = await Promise.all([
        api.get('/categories', { params: { type: 'expense', all: 1 } }),
        api.get('/budget-groups'),
      ])

      const cData = categoriesRes.data?.data
      setCategories(Array.isArray(cData) ? cData : cData?.data || [])

      const bgData = budgetGroupsRes.data?.data
      setBudgetGroups(Array.isArray(bgData) ? bgData : [])
    } catch {
      // Ignore initial master fetch errors
    }
  }, [])

  useEffect(() => {
    fetchMasters()
  }, [fetchMasters])

  // Fetch Calendar Data
  const fetchCalendar = useCallback(async () => {
    setLoadingCalendar(true)
    try {
      const res = await api.get('/expenses/calendar', { params: { month: monthStr } })
      setCalendarData(res.data?.data || { total_month: 0, transaction_count: 0, days: {} })
    } catch (err) {
      toastError(err.userMessage || 'Gagal memuat data kalender pengeluaran')
    } finally {
      setLoadingCalendar(false)
    }
  }, [monthStr])

  // Fetch Table Data
  const fetchTable = useCallback(async () => {
    setLoadingTable(true)
    try {
      const params = {
        month: monthStr,
        page: tablePage,
        per_page: 15,
      }
      if (filters.search) params.search = filters.search
      if (filters.category_id) params.category_id = filters.category_id
      if (filters.budget_group_id) params.budget_group_id = filters.budget_group_id

      const res = await api.get('/expenses', { params })
      const payload = res.data?.data
      setTableData(Array.isArray(payload) ? payload : payload?.data || [])
      setTableMeta(Array.isArray(payload) ? null : payload?.meta || null)
    } catch (err) {
      toastError(err.userMessage || 'Gagal memuat daftar pengeluaran')
    } finally {
      setLoadingTable(false)
    }
  }, [monthStr, tablePage, filters])

  useEffect(() => {
    if (viewMode === 'calendar') {
      fetchCalendar()
    } else {
      fetchTable()
    }
  }, [viewMode, fetchCalendar, fetchTable])

  // Month Navigation
  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
    setTablePage(1)
  }

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
    setTablePage(1)
  }

  const handleTodayMonth = () => {
    const now = new Date()
    setYear(now.getFullYear())
    setMonth(now.getMonth() + 1)
    setTablePage(1)
  }

  // Handlers for interactions
  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr)
    setModalVisible(true)
  }

  const handleAddNew = () => {
    const now = new Date()
    const currentDayStr = `${year}-${String(month).padStart(2, '0')}-${String(
      now.getMonth() + 1 === month && now.getFullYear() === year ? now.getDate() : 1,
    ).padStart(2, '0')}`
    setSelectedDate(currentDayStr)
    setModalVisible(true)
  }

  const handleSaved = () => {
    if (viewMode === 'calendar') {
      fetchCalendar()
    } else {
      fetchTable()
    }
  }

  const handleEditItemFromTable = (item) => {
    const dateStr =
      item.transaction_date instanceof Date
        ? item.transaction_date.toISOString().substring(0, 10)
        : String(item.transaction_date).substring(0, 10)
    setSelectedDate(dateStr)
    setModalVisible(true)
  }

  const handleDeleteItemFromTable = async (id) => {
    if (!window.confirm('Hapus transaksi pengeluaran ini?')) return
    try {
      await api.delete(`/expenses/${id}`)
      toastSuccess('Transaksi pengeluaran berhasil dihapus')
      fetchTable()
    } catch (err) {
      toastError(err.userMessage || 'Gagal menghapus transaksi')
    }
  }

  // Compute daily items for the selectedDate
  const dailyItemsForSelectedDate = calendarData.days?.[selectedDate]?.items || []

  return (
    <div className="mb-4">
      <CCard className="shadow-sm">
        {/* Top Header Toolbar */}
        <CCardHeader className="py-3">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            {/* Left: Title & Month Selector */}
            <div className="d-flex align-items-center gap-2">
              <h5 className="mb-0 fw-bold me-2">Pengeluaran</h5>

              <CButtonGroup size="sm">
                <CButton
                  color="outline-secondary"
                  onClick={handlePrevMonth}
                  title="Bulan Sebelumnya"
                >
                  <CIcon icon={cilChevronLeft} />
                </CButton>
                <CButton color="secondary" className="fw-semibold px-3" disabled>
                  {MONTH_NAMES[month - 1]} {year}
                </CButton>
                <CButton
                  color="outline-secondary"
                  onClick={handleNextMonth}
                  title="Bulan Berikutnya"
                >
                  <CIcon icon={cilChevronRight} />
                </CButton>
              </CButtonGroup>

              <CButton size="sm" color="outline-secondary" onClick={handleTodayMonth}>
                Bulan Ini
              </CButton>

              <CButton
                size="sm"
                color="outline-secondary"
                onClick={viewMode === 'calendar' ? fetchCalendar : fetchTable}
                title="Muat Ulang"
              >
                <CIcon icon={cilReload} />
              </CButton>
            </div>

            {/* Right: View Switcher & Add Button */}
            <div className="d-flex align-items-center gap-2">
              <CButtonGroup size="sm">
                <CButton
                  color={viewMode === 'calendar' ? 'primary' : 'outline-secondary'}
                  onClick={() => setViewMode('calendar')}
                >
                  <CIcon icon={cilCalendar} className="me-1" />
                  Kalender
                </CButton>
                <CButton
                  color={viewMode === 'table' ? 'primary' : 'outline-secondary'}
                  onClick={() => setViewMode('table')}
                >
                  <CIcon icon={cilList} className="me-1" />
                  Tabel
                </CButton>
              </CButtonGroup>

              <CButton color="danger" className="text-white btn-sm" onClick={handleAddNew}>
                <CIcon icon={cilPlus} className="me-1" />
                Tambah Pengeluaran
              </CButton>
            </div>
          </div>

          {/* Month Summary Banner */}
          <div className="mt-3 p-2 px-3 rounded bg-danger-subtle border border-danger-subtle d-flex flex-wrap justify-content-between align-items-center">
            <div className="text-danger-emphasis">
              <small className="text-uppercase fw-semibold d-block">
                Total Pengeluaran {MONTH_NAMES[month - 1]} {year}
              </small>
              <h4 className="fw-bold mb-0 text-danger">
                {formatCurrency(calendarData?.total_month || 0)}
              </h4>
            </div>
            <div>
              <CBadge color="danger" className="fs-6 px-3 py-2">
                {calendarData?.transaction_count || 0} Transaksi Keluar
              </CBadge>
            </div>
          </div>
        </CCardHeader>

        <CCardBody>
          {viewMode === 'calendar' ? (
            <ExpenseCalendar
              year={year}
              month={month}
              calendarData={calendarData}
              loading={loadingCalendar}
              onDateClick={handleDateClick}
            />
          ) : (
            <div>
              {/* Table Filter Toolbar */}
              <CRow className="g-2 mb-3">
                <CCol md={6}>
                  <CFormInput
                    placeholder="Cari catatan, kategori..."
                    value={filters.search}
                    onChange={(e) => {
                      setTablePage(1)
                      setFilters((prev) => ({ ...prev, search: e.target.value }))
                    }}
                  />
                </CCol>

                <CCol md={3}>
                  <CFormSelect
                    value={filters.category_id}
                    onChange={(e) => {
                      setTablePage(1)
                      setFilters((prev) => ({ ...prev, category_id: e.target.value }))
                    }}
                  >
                    <option value="">Semua Kategori</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormSelect
                    value={filters.budget_group_id}
                    onChange={(e) => {
                      setTablePage(1)
                      setFilters((prev) => ({ ...prev, budget_group_id: e.target.value }))
                    }}
                  >
                    <option value="">Semua Kelompok Anggaran</option>
                    {budgetGroups.map((bg) => (
                      <option key={bg.id} value={bg.id}>
                        {bg.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>

              <ExpensesTable
                expenses={tableData}
                loading={loadingTable}
                onEdit={handleEditItemFromTable}
                onDelete={handleDeleteItemFromTable}
              />

              {tableMeta && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <small className="text-body-secondary">
                    Menampilkan {tableData.length} dari {tableMeta.total} transaksi
                  </small>
                  <div>
                    <CButton
                      size="sm"
                      color="secondary"
                      variant="outline"
                      className="me-2"
                      disabled={tablePage <= 1}
                      onClick={() => setTablePage((p) => p - 1)}
                    >
                      Previous
                    </CButton>
                    <CButton
                      size="sm"
                      color="secondary"
                      variant="outline"
                      disabled={tablePage >= tableMeta.last_page}
                      onClick={() => setTablePage((p) => p + 1)}
                    >
                      Next
                    </CButton>
                  </div>
                </div>
              )}
            </div>
          )}
        </CCardBody>
      </CCard>

      {/* Interactive Modal Form */}
      <ExpenseModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        selectedDate={selectedDate}
        dailyItems={dailyItemsForSelectedDate}
        categories={categories}
        onSaved={handleSaved}
      />
    </div>
  )
}

export default Expenses
