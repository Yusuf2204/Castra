import React, { useCallback, useEffect, useState } from 'react'
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CProgress,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilArrowBottom,
  cilArrowTop,
  cilBuilding,
  cilChartPie,
  cilCheckCircle,
  cilListRich,
  cilPeople,
  cilReload,
  cilShieldAlt,
  cilUser,
  cilWallet,
  cilWarning,
} from '@coreui/icons'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import api from '../../services/api'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0))
}

const SummaryCard = ({ color, icon, label, value, subtext, loading }) => (
  <CCard className={`h-100 border-start border-start-4 border-start-${color} shadow-sm`}>
    <CCardBody className="d-flex align-items-center justify-content-between">
      <div>
        <div className="text-body-secondary small mb-1">{label}</div>
        <div className="fs-4 fw-bold">{loading ? <CSpinner size="sm" /> : value}</div>
        {subtext && <div className="text-body-secondary small mt-1">{subtext}</div>}
      </div>
      <div className={`text-${color} p-2 rounded-circle bg-${color} bg-opacity-10`}>
        <CIcon icon={icon} size="xl" />
      </div>
    </CCardBody>
  </CCard>
)

const Dashboard = () => {
  const user = useSelector((state) => state.user)
  const company = useSelector((state) => state.company)
  const [data, setData] = useState({
    system: {
      total_users: 0,
      total_roles: 0,
      total_menus: 0,
      active_role: null,
    },
    finance: {
      month: '',
      kpis: {
        month_income: 0,
        month_expense: 0,
        month_net: 0,
        all_time_income: 0,
        all_time_expense: 0,
        all_time_net: 0,
        total_budget_estimate: 0,
        budget_usage_percentage: 0,
      },
      recent_incomes: [],
      recent_expenses: [],
    },
  })
  const [loading, setLoading] = useState(true)
  const [apiOnline, setApiOnline] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const loadDashboard = useCallback(async () => {
    setLoading(true)

    try {
      const response = await api.get('/dashboard-summary')
      const resData = response.data.data

      setData({
        system: resData.system || {
          total_users: resData.total_users || 0,
          total_roles: resData.total_roles || 0,
          total_menus: resData.total_menus || 0,
          active_role: resData.active_role || null,
        },
        finance: resData.finance || {
          month: '',
          kpis: {
            month_income: 0,
            month_expense: 0,
            month_net: 0,
            all_time_income: 0,
            all_time_expense: 0,
            all_time_net: 0,
            total_budget_estimate: 0,
            budget_usage_percentage: 0,
          },
          recent_incomes: [],
          recent_expenses: [],
        },
      })
      setApiOnline(true)
      setLastUpdated(new Date())
    } catch {
      setApiOnline(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const kpis = data.finance.kpis
  const budgetPct = Number(kpis.budget_usage_percentage || 0)
  const budgetColor = budgetPct > 100 ? 'danger' : budgetPct > 80 ? 'warning' : 'info'

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Dashboard</h2>
          <div className="text-body-secondary">
            Ringkasan Keuangan & Operasional Sistem{' '}
            {data.finance.month ? `(${data.finance.month})` : ''}
          </div>
        </div>
        <CButton color="secondary" variant="outline" onClick={loadDashboard} disabled={loading}>
          <CIcon icon={cilReload} className="me-2" />
          Refresh
        </CButton>
      </div>

      {/* Row 1: Financial KPI Cards */}
      <CRow className="g-3 mb-4">
        <CCol sm={6} xl={3}>
          <SummaryCard
            label="Arus Kas Bersih (Bulan Ini)"
            value={formatCurrency(kpis.month_net)}
            subtext={`Saldo Kumulatif: ${formatCurrency(kpis.all_time_net)}`}
            icon={cilWallet}
            color={kpis.month_net >= 0 ? 'success' : 'danger'}
            loading={loading}
          />
        </CCol>
        <CCol sm={6} xl={3}>
          <SummaryCard
            label="Pemasukan (Bulan Ini)"
            value={formatCurrency(kpis.month_income)}
            subtext={`Total Riwayat: ${formatCurrency(kpis.all_time_income)}`}
            icon={cilArrowTop}
            color="success"
            loading={loading}
          />
        </CCol>
        <CCol sm={6} xl={3}>
          <SummaryCard
            label="Pengeluaran (Bulan Ini)"
            value={formatCurrency(kpis.month_expense)}
            subtext={`Total Riwayat: ${formatCurrency(kpis.all_time_expense)}`}
            icon={cilArrowBottom}
            color="danger"
            loading={loading}
          />
        </CCol>
        <CCol sm={6} xl={3}>
          <SummaryCard
            label={kpis.active_period ? `Realisasi (${kpis.active_period.name})` : 'Realisasi Anggaran'}
            value={`${budgetPct}%`}
            subtext={
              kpis.active_period
                ? `Pagu Siklus: ${formatCurrency(kpis.total_budget_estimate)}`
                : `Estimasi: ${formatCurrency(kpis.total_budget_estimate)}`
            }
            icon={cilChartPie}
            color={budgetColor}
            loading={loading}
          />
        </CCol>
      </CRow>

      {/* Row 2: Recent Transactions */}
      <CRow className="g-3 mb-4">
        {/* Recent Incomes */}
        <CCol lg={6}>
          <CCard className="h-100 shadow-sm border-0">
            <CCardHeader className="bg-transparent d-flex justify-content-between align-items-center">
              <div className="fw-semibold text-success">
                <CIcon icon={cilArrowTop} className="me-2 text-success" />
                Pemasukan Terkini
              </div>
              <Link to="/incomes" className="btn btn-sm btn-outline-success">
                Lihat Semua
              </Link>
            </CCardHeader>
            <CCardBody className="p-0">
              <CTable responsive hover className="mb-0 align-middle">
                <CTableHead className="table-light">
                  <CTableRow>
                    <CTableHeaderCell>Tanggal</CTableHeaderCell>
                    <CTableHeaderCell>Sumber / Kategori</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Jumlah</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {loading ? (
                    <CTableRow>
                      <CTableDataCell colSpan={3} className="text-center py-4">
                        <CSpinner size="sm" />
                      </CTableDataCell>
                    </CTableRow>
                  ) : data.finance.recent_incomes?.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={3} className="text-center py-4 text-muted">
                        Belum ada transaksi pemasukan
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    data.finance.recent_incomes?.map((tx) => (
                      <CTableRow key={tx.id}>
                        <CTableDataCell className="small">{tx.date}</CTableDataCell>
                        <CTableDataCell>
                          <div className="fw-semibold small">{tx.source}</div>
                          <div className="text-body-secondary small">{tx.category}</div>
                        </CTableDataCell>
                        <CTableDataCell className="text-end fw-semibold text-success small">
                          {formatCurrency(tx.amount)}
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>

        {/* Recent Expenses */}
        <CCol lg={6}>
          <CCard className="h-100 shadow-sm border-0">
            <CCardHeader className="bg-transparent d-flex justify-content-between align-items-center">
              <div className="fw-semibold text-danger">
                <CIcon icon={cilArrowBottom} className="me-2 text-danger" />
                Pengeluaran Terkini
              </div>
              <Link to="/expenses" className="btn btn-sm btn-outline-danger">
                Lihat Semua
              </Link>
            </CCardHeader>
            <CCardBody className="p-0">
              <CTable responsive hover className="mb-0 align-middle">
                <CTableHead className="table-light">
                  <CTableRow>
                    <CTableHeaderCell>Tanggal</CTableHeaderCell>
                    <CTableHeaderCell>Kategori / Alokasi</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Jumlah</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {loading ? (
                    <CTableRow>
                      <CTableDataCell colSpan={3} className="text-center py-4">
                        <CSpinner size="sm" />
                      </CTableDataCell>
                    </CTableRow>
                  ) : data.finance.recent_expenses?.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={3} className="text-center py-4 text-muted">
                        Belum ada transaksi pengeluaran
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    data.finance.recent_expenses?.map((tx) => (
                      <CTableRow key={tx.id}>
                        <CTableDataCell className="small">{tx.date}</CTableDataCell>
                        <CTableDataCell>
                          <div className="fw-semibold small">{tx.category}</div>
                          <div className="text-body-secondary small">{tx.budget_group}</div>
                        </CTableDataCell>
                        <CTableDataCell className="text-end fw-semibold text-danger small">
                          {formatCurrency(tx.amount)}
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Row 3: Operational & System Status */}
      <CRow className="g-3">
        <CCol lg={7}>
          <CCard className="h-100 shadow-sm border-0">
            <CCardHeader className="bg-transparent fw-semibold">
              Current Session & Profile
            </CCardHeader>
            <CCardBody>
              <CRow className="g-4">
                <CCol sm={6}>
                  <div className="d-flex align-items-center">
                    <CIcon icon={cilUser} size="xl" className="text-primary me-3" />
                    <div>
                      <div className="text-body-secondary small">Active User</div>
                      <div className="fw-semibold">{user?.name || '-'}</div>
                      <div className="small text-body-secondary">{user?.email || '-'}</div>
                    </div>
                  </div>
                </CCol>
                <CCol sm={6}>
                  <div className="d-flex align-items-center">
                    <CIcon icon={cilShieldAlt} size="xl" className="text-info me-3" />
                    <div>
                      <div className="text-body-secondary small">Active Role</div>
                      <div className="fw-semibold">
                        {loading ? <CSpinner size="sm" /> : data.system.active_role || '-'}
                      </div>
                    </div>
                  </div>
                </CCol>
                <CCol sm={6}>
                  <div className="d-flex align-items-center">
                    <CIcon icon={cilBuilding} size="xl" className="text-success me-3" />
                    <div>
                      <div className="text-body-secondary small">Company</div>
                      <div className="fw-semibold">{company?.comp_name || '-'}</div>
                    </div>
                  </div>
                </CCol>
                <CCol sm={6}>
                  <div className="d-flex align-items-center">
                    <CIcon icon={cilListRich} size="xl" className="text-warning me-3" />
                    <div>
                      <div className="text-body-secondary small">Navigasi Laporan</div>
                      <Link
                        to="/reports"
                        className="btn btn-sm btn-link p-0 fw-semibold text-decoration-none"
                      >
                        Buka Halaman Laporan Keuangan &rarr;
                      </Link>
                    </div>
                  </div>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={5}>
          <CCard className="h-100 shadow-sm border-0">
            <CCardHeader className="bg-transparent fw-semibold">System Status</CCardHeader>
            <CCardBody>
              <div className="d-flex align-items-center mb-3">
                <CIcon
                  icon={apiOnline ? cilCheckCircle : cilWarning}
                  size="xl"
                  className={`${apiOnline ? 'text-success' : 'text-danger'} me-3`}
                />
                <div>
                  <div className="text-body-secondary small">API Status</div>
                  <div className="fw-semibold">
                    {loading ? 'Checking...' : apiOnline ? 'Operational' : 'Unavailable'}
                  </div>
                </div>
              </div>
              <div className="small text-body-secondary">
                Last updated:{' '}
                {lastUpdated
                  ? new Intl.DateTimeFormat('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'medium',
                    }).format(lastUpdated)
                  : '-'}
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default Dashboard
