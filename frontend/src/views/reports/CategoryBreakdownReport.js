import React, { useCallback, useEffect, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
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

const CategoryBreakdownReport = ({ month }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/reports/category-breakdown', { params: { month } })
      setData(res.data?.data || null)
    } catch (err) {
      toastError(err.userMessage || 'Gagal memuat rincian kategori')
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
        <div className="mt-2 text-body-secondary">Memuat rincian pengeluaran per kategori...</div>
      </div>
    )
  }

  if (!data || !data.categories || data.categories.length === 0) {
    return (
      <div className="text-center py-5 text-body-secondary">
        Belum ada transaksi pengeluaran pada bulan {month}.
      </div>
    )
  }

  return (
    <div>
      {/* Budget Groups Breakdown Cards */}
      <h6 className="fw-bold mb-3">Rincian Berdasarkan Kelompok Anggaran (Alokasi)</h6>
      <div className="row g-3 mb-4">
        {data.budget_groups.map((bg) => (
          <div key={bg.id} className="col-md-3">
            <CCard className="h-100 shadow-sm border-top border-top-3 border-top-primary">
              <CCardBody>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold">{bg.name}</span>
                  <CBadge color="primary">{bg.percentage}%</CBadge>
                </div>
                <div className="fs-5 fw-bold text-danger mb-2">{formatCurrency(bg.total)}</div>
                <CProgress thin>
                  <CProgressBar color="primary" value={bg.percentage} />
                </CProgress>
              </CCardBody>
            </CCard>
          </div>
        ))}
      </div>

      {/* Full 12-Col Table Grid */}
      <CCard className="shadow-sm">
        <CCardHeader className="fw-bold">
          Daftar Pengeluaran per Kategori (Urut Terbesar)
        </CCardHeader>
        <CCardBody className="p-0">
          <CTable hover responsive align="middle" className="mb-0">
            <CTableHead className="table-light">
              <CTableRow>
                <CTableHeaderCell width={60}>#</CTableHeaderCell>
                <CTableHeaderCell>Kategori Pengeluaran</CTableHeaderCell>
                <CTableHeaderCell>Kelompok Anggaran</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Total Pengeluaran (Rp)</CTableHeaderCell>
                <CTableHeaderCell width={200}>Porsi terhadap Total</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {data.categories.map((item, idx) => (
                <CTableRow key={item.category_id}>
                  <CTableDataCell className="text-body-secondary">{idx + 1}</CTableDataCell>
                  <CTableDataCell>
                    <strong>{item.category_name}</strong>
                  </CTableDataCell>
                  <CTableDataCell>
                    <CBadge color="info">{item.budget_group_name}</CBadge>
                  </CTableDataCell>
                  <CTableDataCell className="text-end text-danger fw-bold">
                    {formatCurrency(item.total_expense)}
                  </CTableDataCell>
                  <CTableDataCell>
                    <div className="d-flex align-items-center gap-2">
                      <small className="fw-bold" style={{ minWidth: '45px' }}>
                        {item.percentage}%
                      </small>
                      <CProgress thin className="flex-grow-1">
                        <CProgressBar color="danger" value={item.percentage} />
                      </CProgress>
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>

            <tfoot>
              <tr className="table-light fw-bold fs-6 border-top border-2">
                <td colSpan={3}>TOTAL PENGELUARAN BULAN {month}</td>
                <td className="text-end text-danger">{formatCurrency(data.total_expense)}</td>
                <td>100%</td>
              </tr>
            </tfoot>
          </CTable>
        </CCardBody>
      </CCard>
    </div>
  )
}

export default CategoryBreakdownReport
