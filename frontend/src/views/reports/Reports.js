import React, { useState } from 'react'
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

const Reports = () => {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonthStr = `${currentYear}-${String(today.getMonth() + 1).padStart(2, '0')}`

  const [activeTab, setActiveTab] = useState('cash-flow') // 'cash-flow' | 'budget-comparison' | 'category-breakdown'
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr)
  const [reloadKey, setReloadKey] = useState(0)

  const handleReload = () => {
    setReloadKey((k) => k + 1)
  }

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
            <CCol lg={5} className="d-flex align-items-center justify-content-lg-end gap-2">
              {activeTab === 'cash-flow' ? (
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
              ) : (
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
              key={`bc-${selectedMonth}-${reloadKey}`}
              month={selectedMonth}
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
