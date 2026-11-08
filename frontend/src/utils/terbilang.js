/**
 * Utility untuk konversi angka/nominal ke dalam format teks Terbilang (Bahasa Indonesia).
 * Cocok untuk kwitansi, voucher kas (BKK / BKM), dan faktur.
 */

const satuan = [
  '',
  'Satu',
  'Dua',
  'Tiga',
  'Empat',
  'Lima',
  'Enam',
  'Tujuh',
  'Delapan',
  'Sembilan',
  'Sepuluh',
  'Sebelas',
]

const konversi = (n) => {
  const num = Math.floor(Math.abs(n))
  if (num < 12) {
    return satuan[num]
  }
  if (num < 20) {
    return `${konversi(num - 10)} Belas`
  }
  if (num < 100) {
    const sisa = num % 10
    return `${konversi(Math.floor(num / 10))} Puluh ${sisa > 0 ? konversi(sisa) : ''}`.trim()
  }
  if (num < 200) {
    const sisa = num - 100
    return `Seratus ${sisa > 0 ? konversi(sisa) : ''}`.trim()
  }
  if (num < 1000) {
    const sisa = num % 100
    return `${konversi(Math.floor(num / 100))} Ratus ${sisa > 0 ? konversi(sisa) : ''}`.trim()
  }
  if (num < 2000) {
    const sisa = num - 1000
    return `Seribu ${sisa > 0 ? konversi(sisa) : ''}`.trim()
  }
  if (num < 1000000) {
    const sisa = num % 1000
    return `${konversi(Math.floor(num / 1000))} Ribu ${sisa > 0 ? konversi(sisa) : ''}`.trim()
  }
  if (num < 1000000000) {
    const sisa = num % 1000000
    return `${konversi(Math.floor(num / 1000000))} Juta ${sisa > 0 ? konversi(sisa) : ''}`.trim()
  }
  if (num < 1000000000000) {
    const sisa = num % 1000000000
    return `${konversi(Math.floor(num / 1000000000))} Miliar ${sisa > 0 ? konversi(sisa) : ''}`.trim()
  }
  if (num < 1000000000000000) {
    const sisa = num % 1000000000000
    return `${konversi(Math.floor(num / 1000000000000))} Triliun ${sisa > 0 ? konversi(sisa) : ''}`.trim()
  }
  return String(num)
}

export const terbilang = (amount) => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return 'Nol Rupiah'
  }

  const num = Math.floor(Math.abs(Number(amount)))
  if (num === 0) {
    return 'Nol Rupiah'
  }

  const hasil = konversi(num)
  return `${hasil} Rupiah`
}

export default terbilang
