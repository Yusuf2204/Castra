import React from 'react'
import { CBadge, CSpinner } from '@coreui/react'

const DAYS_HEADER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

const formatCurrencyCompact = (val) => {
  if (!val) return ''
  if (val >= 1000000000) {
    return `+${(val / 1000000000).toFixed(1)}M`
  }
  if (val >= 1000000) {
    return `+${(val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1)}jt`
  }
  if (val >= 1000) {
    return `+${(val / 1000).toFixed(0)}rb`
  }
  return `+${val}`
}

const formatCurrencyFull = (val) => {
  if (!val) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(val))
}

const IncomeCalendar = ({ year, month, calendarData, loading, onDateClick }) => {
  const daysInMonth = new Date(year, month, 0).getDate()
  // getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
  // We want Monday (1) to be index 0, Sunday (0) to be index 6:
  const firstDayRaw = new Date(year, month - 1, 1).getDay()
  const startDayOffset = (firstDayRaw + 6) % 7

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate(),
  ).padStart(2, '0')}`

  const daysData = calendarData?.days || {}

  const cells = []
  // Empty leading days
  for (let i = 0; i < startDayOffset; i++) {
    cells.push({ empty: true, key: `empty-${i}` })
  }

  // Days in month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dayInfo = daysData[dateStr] || null
    cells.push({
      empty: false,
      day: d,
      dateStr,
      isToday: dateStr === todayStr,
      hasData: Boolean(dayInfo && dayInfo.total > 0),
      dayInfo,
      key: dateStr,
    })
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" />
        <div className="mt-2 text-body-secondary">Memuat data kalender pemasukan...</div>
      </div>
    )
  }

  return (
    <div className="border rounded bg-body">
      {/* Day Names Header */}
      <div
        className="d-grid text-center fw-bold py-2 border-bottom bg-body-tertiary"
        style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}
      >
        {DAYS_HEADER.map((dayName, idx) => (
          <div key={dayName} className={idx >= 5 ? 'text-danger' : 'text-body'}>
            {dayName}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div
        className="d-grid"
        style={{
          gridTemplateColumns: 'repeat(7, 1fr)',
          minHeight: '480px',
        }}
      >
        {cells.map((cell) => {
          if (cell.empty) {
            return (
              <div
                key={cell.key}
                className="border-bottom border-end p-2 bg-body-tertiary opacity-25"
                style={{ minHeight: '85px' }}
              />
            )
          }

          const hasIncome = cell.hasData

          return (
            <div
              key={cell.key}
              onClick={() => onDateClick(cell.dateStr)}
              className={`border-bottom border-end p-2 position-relative d-flex flex-column justify-content-between transition-all ${
                cell.isToday ? 'border-primary border-2 bg-primary-subtle' : ''
              } ${hasIncome ? 'bg-success-subtle' : 'hover-bg-light'}`}
              style={{
                minHeight: '85px',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              title={
                hasIncome
                  ? `${cell.dayInfo.count} transaksi (${formatCurrencyFull(cell.dayInfo.total)}) - Klik untuk detail`
                  : `Klik untuk catat pemasukan tanggal ${cell.day}`
              }
            >
              <div className="d-flex justify-content-between align-items-center">
                <span
                  className={`badge rounded-circle p-1 ${
                    cell.isToday
                      ? 'bg-primary text-white'
                      : hasIncome
                        ? 'bg-success text-white'
                        : 'text-body'
                  }`}
                  style={{ width: '24px', height: '24px', lineHeight: '16px' }}
                >
                  {cell.day}
                </span>

                {hasIncome && (
                  <CBadge color="success" className="d-none d-md-inline">
                    {cell.dayInfo.count} tx
                  </CBadge>
                )}
              </div>

              {hasIncome ? (
                <div className="mt-1 text-end">
                  <div className="fw-bold text-success" style={{ fontSize: '0.85rem' }}>
                    <span className="d-none d-lg-inline">
                      {formatCurrencyFull(cell.dayInfo.total)}
                    </span>
                    <span className="d-inline d-lg-none">
                      {formatCurrencyCompact(cell.dayInfo.total)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-muted small text-end opacity-25 d-none d-sm-block">+</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default IncomeCalendar
