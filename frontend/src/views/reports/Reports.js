import React, { useEffect, useState } from 'react'
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CButton,
  CButtonGroup,
  CFormSelect,
  CFormInput,
} from '@coreui/react'
import { CIcon } from '@coreui/icons-react'
import { cilReload, cilChartLine, cilBalanceScale, cilChartPie } from '@coreui/icons'
import CashFlowReport from './CashFlowReport'
import BudgetComparisonReport from './BudgetComparisonReport'
import CategoryBreakdownReport from './CategoryBreakdownReport'
import api from '../../services/api'

const Reports = () => {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonthStr = `${currentYear}-${String(today.getMonth() + 1).padStart(2, '0')}`

  const [activeTab, setActiveTab] = useState('cash-flow') // 'cash-flow' | 'budget-comparison' | 'category-breakdown'
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr)
  const [reloadKey, setReloadKey] = useState(0)

  // Budget comparison period mode: 'period' | 'month'
  const [budgetMode, setBudgetMode] = useState('period')
  const [budgetPeriods, setBudgetPeriods] = useState([])
  const [selectedPeriodId, setSelectedPeriodId] = useState('')

  const handleReload = () => {
    setReloadKey((k) => k + 1)
  }

  // Fetch available budget periods for dropdown
  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        const res = await api.get('/budget-periods')
        const list = res.data?.data || []
        setBudgetPeriods(list)
        if (list.length > 0 && !selectedPeriodId) {
          const active = list.find((p) => p.is_active) || list[0]
          setSelectedPeriodId(String(active.id))
        }
      } catch {
        setBudgetPeriods([])
      }
    }
    fetchPeriods()
  }, [])

  return (
    <div className="mb-4">
      {/* Top Row: Filter Bar (Pola 3) */}
      <CCard className="mb-4 shadow-sm">
        <CCardBody className="py-3">
          <CRow className="g-3 align-items-center justify-content-between">
            {/* Left: Tab Navigator */}
            <CCol lg={6}>
              <CButtonGroup size="sm" className="w-100 flex-wrap">
                <CButton
                  color={activeTab === 'cash-flow' ? 'primary' : 'outline-secondary'}
                  onClick={() => setActiveTab('cash-flow')}
                  className="py-2"
                >
                  <CIcon icon={cilChartLine} className="me-1" />
                  Arus Kas Bulanan
                </CButton>
                <CButton
                  color={activeTab === 'budget-comparison' ? 'primary' : 'outline-secondary'}
                  onClick={() => setActiveTab('budget-comparison')}
                  className="py-2"
                >
                  <CIcon icon={cilBalanceScale} className="me-1" />
                  Realisasi Anggaran
                </CButton>
                <CButton
                  color={activeTab === 'category-breakdown' ? 'primary' : 'outline-secondary'}
                  onClick={() => setActiveTab('category-breakdown')}
                  className="py-2"
                >
                  <CIcon icon={cilChartPie} className="me-1" />
                  Rincian Kategori
                </CButton>
              </CButtonGroup>
            </CCol>

            {/* Right: Period Filter Controls */}
            <CCol lg={6} className="d-flex align-items-center justify-content-lg-end gap-2 flex-wrap">
              {activeTab === 'cash-flow' && (
                <div className="d-flex align-items-center gap-2">
                  <label className="text-nowrap small text-body-secondary fw-semibold">
                    Tahun:
                  </label>
                  <CFormSelect
                    size="sm"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    style={{ width: '120px' }}
                  >
                    {[currentYear + 1, currentYear, currentYear - 1, currentYear - 2].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </CFormSelect>
                </div>
              )}

              {activeTab === 'budget-comparison' && (
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <CButtonGroup size="sm">
                    <CButton
                      color={budgetMode === 'period' ? 'info' : 'outline-secondary'}
                      onClick={() => setBudgetMode('period')}
                      size="sm"
                    >
                      Siklus Gaji
                    </CButton>
                    <CButton
                      color={budgetMode === 'month' ? 'info' : 'outline-secondary'}
                      onClick={() => setBudgetMode('month')}
                      size="sm"
                    >
                      Kalender (1-31)
                    </CButton>
                  </CButtonGroup>

                  {budgetMode === 'period' ? (
                    <CFormSelect
                      size="sm"
                      value={selectedPeriodId}
                      onChange={(e) => setSelectedPeriodId(e.target.value)}
                      style={{ minWidth: '180px', maxWidth: '240px' }}
                    >
                      {budgetPeriods.length === 0 ? (
                        <option value="">(Belum ada siklus)</option>
                      ) : (
                        budgetPeriods.map((bp) => (
                          <option key={bp.id} value={bp.id}>
                            {bp.name} {bp.is_active ? '★ (Aktif)' : ''}
                          </option>
                        ))
                      )}
                    </CFormSelect>
                  ) : (
                    <CFormInput
                      type="month"
                      size="sm"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      style={{ width: '150px' }}
                    />
                  )}
                </div>
              )}

              {activeTab === 'category-breakdown' && (
                <div className="d-flex align-items-center gap-2">
                  <label className="text-nowrap small text-body-secondary fw-semibold">
                    Bulan:
                  </label>
                  <CFormInput
                    type="month"
                    size="sm"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    style={{ width: '160px' }}
                  />
                </div>
              )}

              <CButton
                size="sm"
                color="secondary"
                variant="outline"
                onClick={handleReload}
                title="Muat Ulang"
              >
                <CIcon icon={cilReload} />
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Bottom Row: Full 12-Col Table Grid (Pola 3) */}
      <CRow>
        <CCol xs={12}>
          {activeTab === 'cash-flow' && (
            <CashFlowReport key={`cf-${selectedYear}-${reloadKey}`} year={selectedYear} />
          )}
          {activeTab === 'budget-comparison' && (
            <BudgetComparisonReport
              key={`bc-${budgetMode}-${budgetMode === 'period' ? selectedPeriodId : selectedMonth}-${reloadKey}`}
              month={budgetMode === 'month' ? selectedMonth : null}
              periodId={budgetMode === 'period' && selectedPeriodId ? Number(selectedPeriodId) : null}
            />
          )}
          {activeTab === 'category-breakdown' && (
            <CategoryBreakdownReport
              key={`cb-${selectedMonth}-${reloadKey}`}
              month={selectedMonth}
            />
          )}
        </CCol>
      </CRow>
    </div>
  )
}

export default Reports
