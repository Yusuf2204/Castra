import React, { useCallback, useEffect, useState } from 'react'
import { CButton, CCard, CCardBody, CCardHeader, CCol, CRow, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilBuilding,
  cilCheckCircle,
  cilListRich,
  cilPeople,
  cilReload,
  cilShieldAlt,
  cilUser,
  cilWarning,
} from '@coreui/icons'
import { useSelector } from 'react-redux'
import api from '../../services/api'

const SummaryCard = ({ color, icon, label, value, loading }) => (
  <CCard className={`h-100 border-start border-start-4 border-start-${color}`}>
    <CCardBody className="d-flex align-items-center justify-content-between">
      <div>
        <div className="text-body-secondary small mb-1">{label}</div>
        <div className="fs-3 fw-semibold">{loading ? <CSpinner size="sm" /> : value}</div>
      </div>
      <div className={`text-${color}`}>
        <CIcon icon={icon} size="xxl" />
      </div>
    </CCardBody>
  </CCard>
)

const Dashboard = () => {
  const user = useSelector((state) => state.user)
  const company = useSelector((state) => state.company)
  const [summary, setSummary] = useState({
    users: 0,
    roles: 0,
    menus: 0,
    roleName: null,
  })
  const [loading, setLoading] = useState(true)
  const [apiOnline, setApiOnline] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const loadDashboard = useCallback(async () => {
    setLoading(true)

    try {
      const response = await api.get('/dashboard-summary')
      const data = response.data.data

      setSummary({
        users: data.total_users,
        roles: data.total_roles,
        menus: data.total_menus,
        roleName: data.active_role,
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

  const cards = [
    {
      label: 'Total Users',
      value: summary.users,
      icon: cilPeople,
      color: 'primary',
    },
    {
      label: 'Total Roles',
      value: summary.roles,
      icon: cilShieldAlt,
      color: 'info',
    },
    {
      label: 'Total Menus',
      value: summary.menus,
      icon: cilListRich,
      color: 'warning',
    },
    {
      label: 'Company',
      value: company?.comp_name || '-',
      icon: cilBuilding,
      color: 'success',
    },
  ]

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Dashboard</h2>
          <div className="text-body-secondary">CMS operational overview</div>
        </div>
        <CButton color="secondary" variant="outline" onClick={loadDashboard} disabled={loading}>
          <CIcon icon={cilReload} className="me-2" />
          Refresh
        </CButton>
      </div>

      <CRow className="g-3 mb-4">
        {cards.map((card) => (
          <CCol sm={6} xl={3} key={card.label}>
            <SummaryCard {...card} loading={loading} />
          </CCol>
        ))}
      </CRow>

      <CRow className="g-3">
        <CCol lg={7}>
          <CCard className="h-100">
            <CCardHeader>Current Session</CCardHeader>
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
                        {loading ? <CSpinner size="sm" /> : summary.roleName || '-'}
                      </div>
                    </div>
                  </div>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={5}>
          <CCard className="h-100">
            <CCardHeader>System Status</CCardHeader>
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
                  ? new Intl.DateTimeFormat('en-GB', {
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
