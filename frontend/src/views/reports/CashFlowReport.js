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
} from '@coreui/react'
import api from '../../services/api'
import { toastError } from '../../services/toastService'

const formatCurrency = (val) => {
  if (val === null || val === undefined || val === '') return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val)
}

const CashFlowReport = ({ year }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/reports/cash-flow', { params: { year } })
      setData(res.data?.data || null)
    } catch (err) {
      toastError(err.userMessage || 'Gagal memuat laporan arus kas')
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" />
        <div className="mt-2 text-body-secondary">Memuat laporan arus kas tahun {year}...</div>
      </div>
    )
  }

  if (!data || !data.months) {
    return <div className="text-center py-4 text-body-secondary">Tidak ada data arus kas.</div>
  }

  return (
    <div>
      {/* 4 KPI Summary Cards on Top */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <CCard className="border-start border-start-4 border-start-success h-100 shadow-sm">
            <CCardBody>
              <div className="text-body-secondary small mb-1">TOTAL PEMASUKAN {year}</div>
              <div className="fs-4 fw-bold text-success">
                {formatCurrency(data.total_income_year)}
              </div>
            </CCardBody>
          </CCard>
        </div>
        <div className="col-md-4">
          <CCard className="border-start border-start-4 border-start-danger h-100 shadow-sm">
            <CCardBody>
              <div className="text-body-secondary small mb-1">TOTAL PENGELUARAN {year}</div>
              <div className="fs-4 fw-bold text-danger">
                {formatCurrency(data.total_expense_year)}
              </div>
            </CCardBody>
          </CCard>
        </div>
        <div className="col-md-4">
          <CCard
            className={`border-start border-start-4 border-start-${
              data.net_balance_year >= 0 ? 'primary' : 'warning'
            } h-100 shadow-sm`}
          >
            <CCardBody>
              <div className="text-body-secondary small mb-1">SALDO BERSIH {year}</div>
              <div
                className={`fs-4 fw-bold text-${data.net_balance_year >= 0 ? 'primary' : 'warning'}`}
              >
                {formatCurrency(data.net_balance_year)}
              </div>
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
                <CTableHeaderCell>Bulan</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Pemasukan (Rp)</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Pengeluaran (Rp)</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Saldo Bersih (Rp)</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Akumulasi Saldo (Rp)</CTableHeaderCell>
                <CTableHeaderCell className="text-center" width={120}>
                  Status
                </CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {data.months.map((row) => (
                <CTableRow key={row.month}>
                  <CTableDataCell>
                    <strong>{row.month_name}</strong>
                  </CTableDataCell>
                  <CTableDataCell className="text-end text-success fw-semibold">
                    {formatCurrency(row.total_income)}
                  </CTableDataCell>
                  <CTableDataCell className="text-end text-danger fw-semibold">
                    {formatCurrency(row.total_expense)}
                  </CTableDataCell>
                  <CTableDataCell
                    className={`text-end fw-bold ${row.net_balance >= 0 ? 'text-primary' : 'text-danger'}`}
                  >
                    {formatCurrency(row.net_balance)}
                  </CTableDataCell>
                  <CTableDataCell
                    className={`text-end fw-bold ${row.cumulative_balance >= 0 ? 'text-dark' : 'text-danger'}`}
                  >
                    {formatCurrency(row.cumulative_balance)}
                  </CTableDataCell>
                  <CTableDataCell className="text-center">
                    {row.total_income === 0 && row.total_expense === 0 ? (
                      <CBadge color="secondary">Kosong</CBadge>
                    ) : row.net_balance >= 0 ? (
                      <CBadge color="success">Surplus</CBadge>
                    ) : (
                      <CBadge color="danger">Defisit</CBadge>
                    )}
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>

            <tfoot>
              <tr className="table-light fw-bold fs-6 border-top border-2">
                <td>TOTAL {year}</td>
                <td className="text-end text-success">{formatCurrency(data.total_income_year)}</td>
                <td className="text-end text-danger">{formatCurrency(data.total_expense_year)}</td>
                <td
                  className={`text-end ${data.net_balance_year >= 0 ? 'text-primary' : 'text-danger'}`}
                >
                  {formatCurrency(data.net_balance_year)}
                </td>
                <td className="text-end">
                  {formatCurrency(
                    data.months.length > 0
                      ? data.months[data.months.length - 1].cumulative_balance
                      : 0,
                  )}
                </td>
                <td className="text-center">
                  <CBadge color={data.net_balance_year >= 0 ? 'success' : 'danger'}>
                    {data.net_balance_year >= 0 ? 'Surplus' : 'Defisit'}
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

export default CashFlowReport
