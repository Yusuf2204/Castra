import React, { useCallback, useEffect, useState } from 'react'
import {
  CCard,
  CCardBody,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CSpinner,
  CBadge,
  CProgress,
  CProgressBar,
} from '@coreui/react'
import api from '../../services/api'
import { toastError } from '../../services/toastService'

const formatCurrency = (val) => {
  if (val === null || val === undefined || val === '') return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(val))
}

const renderStatusBadge = (status) => {
  switch (status) {
    case 'safe':
      return <CBadge color="success">Aman (≤80%)</CBadge>
    case 'near_limit':
      return <CBadge color="warning">Mendekati Batas (80-100%)</CBadge>
    case 'over_budget':
      return <CBadge color="danger">Melebihi Anggaran (&gt;100%)</CBadge>
    default:
      return <CBadge color="secondary">-</CBadge>
  }
}

const BudgetComparisonReport = ({ month }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/reports/budget-comparison', { params: { month } })
      setData(res.data?.data || null)
    } catch (err) {
      toastError(err.userMessage || 'Gagal memuat laporan realisasi anggaran')
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" />
        <div className="mt-2 text-body-secondary">Memuat laporan realisasi anggaran {month}...</div>
      </div>
    )
  }

  if (!data || !data.items) {
    return (
      <div className="text-center py-4 text-body-secondary">
        Tidak ada data perbandingan anggaran.
      </div>
    )
  }

  return (
    <div>
      {/* 4 Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <CCard className="border-start border-start-4 border-start-info h-100 shadow-sm">
            <CCardBody>
              <div className="text-body-secondary small mb-1">TOTAL ANGGARAN ESTIMASI</div>
              <div className="fs-5 fw-bold text-info">{formatCurrency(data.total_estimated)}</div>
            </CCardBody>
          </CCard>
        </div>

        <div className="col-md-3">
          <CCard className="border-start border-start-4 border-start-danger h-100 shadow-sm">
            <CCardBody>
              <div className="text-body-secondary small mb-1">TOTAL PENGELUARAN AKTUAL</div>
              <div className="fs-5 fw-bold text-danger">{formatCurrency(data.total_actual)}</div>
            </CCardBody>
          </CCard>
        </div>

        <div className="col-md-3">
          <CCard
            className={`border-start border-start-4 border-start-${
              data.total_variance >= 0 ? 'success' : 'danger'
            } h-100 shadow-sm`}
          >
            <CCardBody>
              <div className="text-body-secondary small mb-1">SISA ANGGARAN (VARIANS)</div>
              <div
                className={`fs-5 fw-bold text-${data.total_variance >= 0 ? 'success' : 'danger'}`}
              >
                {formatCurrency(data.total_variance)}
              </div>
            </CCardBody>
          </CCard>
        </div>

        <div className="col-md-3">
          <CCard className="border-start border-start-4 border-start-primary h-100 shadow-sm">
            <CCardBody>
              <div className="text-body-secondary small mb-1">PERSENTASE PEMAKAIAN</div>
              <div className="fs-5 fw-bold text-primary">{data.overall_usage_percentage}%</div>
            </CCardBody>
          </CCard>
        </div>
      </div>

      {/* Full 12-Col Table Grid */}
      <CCard className="shadow-sm">
        <CCardBody className="p-0">
          <CTable hover responsive align="middle" className="mb-0">
            <CTableHead className="table-light">
              <CTableRow>
                <CTableHeaderCell>Kategori Pengeluaran</CTableHeaderCell>
                <CTableHeaderCell>Kelompok</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Estimasi (Rp)</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Aktual (Rp)</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Sisa / Selisih (Rp)</CTableHeaderCell>
                <CTableHeaderCell width={180}>Pemakaian</CTableHeaderCell>
                <CTableHeaderCell className="text-center" width={160}>
                  Status
                </CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {data.items.map((row) => {
                const progressColor =
                  row.status === 'over_budget'
                    ? 'danger'
                    : row.status === 'near_limit'
                      ? 'warning'
                      : 'success'

                return (
                  <CTableRow key={row.category_id}>
                    <CTableDataCell>
                      <strong>{row.category_name}</strong>
                    </CTableDataCell>

                    <CTableDataCell>
                      {row.budget_group ? (
                        <CBadge color="info">
                          {row.budget_group.name} ({row.budget_group.percentage}%)
                        </CBadge>
                      ) : (
                        <span className="text-body-secondary">-</span>
                      )}
                    </CTableDataCell>

                    <CTableDataCell className="text-end text-body-secondary fw-semibold">
                      {formatCurrency(row.monthly_estimate)}
                    </CTableDataCell>

                    <CTableDataCell className="text-end text-danger fw-bold">
                      {formatCurrency(row.actual_expense)}
                    </CTableDataCell>

                    <CTableDataCell
                      className={`text-end fw-semibold ${row.variance >= 0 ? 'text-success' : 'text-danger'}`}
                    >
                      {formatCurrency(row.variance)}
                    </CTableDataCell>

                    <CTableDataCell>
                      <div className="d-flex align-items-center gap-2">
                        <small className="fw-bold" style={{ minWidth: '45px' }}>
                          {row.usage_percentage}%
                        </small>
                        <CProgress thin className="flex-grow-1">
                          <CProgressBar
                            color={progressColor}
                            value={Math.min(row.usage_percentage, 100)}
                          />
                        </CProgress>
                      </div>
                    </CTableDataCell>

                    <CTableDataCell className="text-center">
                      {renderStatusBadge(row.status)}
                    </CTableDataCell>
                  </CTableRow>
                )
              })}
            </CTableBody>

            <tfoot>
              <tr className="table-light fw-bold fs-6 border-top border-2">
                <td colSpan={2}>TOTAL BULAN {month}</td>
                <td className="text-end">{formatCurrency(data.total_estimated)}</td>
                <td className="text-end text-danger">{formatCurrency(data.total_actual)}</td>
                <td
                  className={`text-end ${data.total_variance >= 0 ? 'text-success' : 'text-danger'}`}
                >
                  {formatCurrency(data.total_variance)}
                </td>
                <td>{data.overall_usage_percentage}%</td>
                <td className="text-center">
                  <CBadge
                    color={
                      data.overall_usage_percentage > 100
                        ? 'danger'
                        : data.overall_usage_percentage >= 80
                          ? 'warning'
                          : 'success'
                    }
                  >
                    {data.overall_usage_percentage > 100
                      ? 'Over Budget'
                      : data.overall_usage_percentage >= 80
                        ? 'Near Limit'
                        : 'Aman'}
                  </CBadge>
                </td>
              </tr>
            </tfoot>
          </CTable>
        </CCardBody>
      </CCard>
    </div>
  )
}

export default BudgetComparisonReport
