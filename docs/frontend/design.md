# Frontend Design - Castra

## Fondasi

UI Castra memakai **CoreUI 5 (free)** React Admin Template. Gunakan komponen
CoreUI, SCSS terpusat, dan pola layout admin existing. Aplikasi ini adalah alat
operasional harian, jadi tampilan harus padat, jelas, dan mudah dipindai.

## Prinsip Desain

1. Angka dulu: nominal, budget, sisa, dan status adalah konten utama.
2. Alur pemasukan harus eksplisit: user melihat dari mana uang masuk dan ke mana
   uang dialokasikan.
3. Need/Fun/Saving selalu menjadi struktur visual utama.
4. Emergency ditampilkan sebagai reserve/sisa rencana, bukan pembagian utama
   yang menambah total budget.
5. Status tidak boleh hanya bergantung pada warna; tampilkan label dan tanda.

## Layout Menu

- `Dashboard`: ringkasan periode aktif.
- `Keuangan`:
  - `Pemasukan`
  - `Rincian Transaksi`
  - `Rencana Bulanan`
  - `Ringkasan Bulanan`
- `Master`:
  - `Sumber Dana`
  - `Pembagian Budget`
  - `Kategori`
- `Setup`: modul sistem existing.

Menu tetap berasal dari backend melalui `navigation`.

## Dashboard Keuangan

Dashboard mengikuti sheet `Dashboard`.

Komponen utama:

- Period selector bulan/tahun.
- Kartu ringkasan:
  - Total Pemasukan
  - Total Realisasi Pengeluaran
  - Sisa Alokasi
  - Net
- Kondisi per Pembagian:
  - Pembagian
  - Budget
  - Realisasi
  - Sisa
  - Status
- Estimasi vs Realisasi:
  - Kategori
  - Estimasi
  - Realisasi
  - Selisih
  - Persentase
- Kesimpulan bulanan berbasis status.
- Transaksi terbaru.

Status:

- `Aman`: badge success
- `Mendekati Batas`: badge warning
- `Over Budget`: badge danger

## Pemasukan

Halaman untuk menjawab masalah workbook: "bagaimana membagi jika ada pemasukan?"

Elemen UI:

- Filter periode bulan/tahun.
- Kartu total pemasukan periode.
- Form tambah pemasukan:
  - tanggal
  - sumber dana
  - nominal
  - catatan
  - opsi `alokasikan otomatis` aktif secara default
- Panel hasil alokasi:
  - Need 50%
  - Fun 30%
  - Saving 20%
  - Emergency/Reserve dari sisa rencana
- Tabel pemasukan periode.

Setelah submit sukses, halaman menampilkan allocation preview hasil backend,
bukan menghitung angka final sendiri.

## Rencana Bulanan

Padanan utama sheet `Estimasi`.

Elemen UI:

- Period selector.
- Summary total pemasukan dan total alokasi.
- Tabel pembagian budget:
  - Pembagian
  - Persentase
  - Budget
  - Estimasi kategori
  - Reserve
- Tabel estimasi kategori:
  - Kategori
  - Pembagian
  - Estimasi
  - Realisasi
  - Sisa
  - Status
- Tombol recalculate alokasi.

Editing estimasi kategori dilakukan inline atau modal sederhana. Hindari wizard;
workflow ini akan sering dipakai.

## Rincian Transaksi

Padanan sheet `Rincian`.

Filter:

- periode bulan/tahun
- rentang tanggal
- tipe transaksi
- kategori
- pembagian budget

Tabel:

- Tanggal
- Tipe
- Kategori
- Pembagian
- Budget
- Nominal
- Sisa Budget
- Status
- Keterangan
- Aksi

Nominal pemasukan ditampilkan hijau dengan tanda `+`; pengeluaran merah dengan
tanda `-`. Input nominal tetap angka positif.

## Master Sumber Dana

Tabel:

- Nama
- Deskripsi
- Status aktif
- Aksi

Sumber dana yang sudah dipakai transaksi tidak boleh dihapus keras. UI harus
menawarkan nonaktifkan bila backend menolak delete.

## Master Pembagian Budget

Tabel:

- Nama
- Kode
- Persentase
- Urutan
- Status
- Aksi

Default: Need 50%, Fun 30%, Saving 20%, Emergency 0%.
UI wajib menampilkan indikator total persentase group utama. Simpan dinonaktifkan
jika total bukan 100%.

## Master Kategori

Tabs:

- Pemasukan
- Pengeluaran

Tabel kategori pengeluaran:

- Nama
- Pembagian
- Estimasi default
- Status
- Aksi

Tabel kategori pemasukan:

- Nama
- Status
- Aksi

Saat tipe `expense`, field pembagian wajib. Saat tipe `income`, field pembagian
disembunyikan atau opsional.

## Warna dan Angka

- Pemasukan: success.
- Pengeluaran: danger.
- Mendekati batas: warning.
- Netral: variabel CoreUI.
- Format uang: `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })`.
- Angka di tabel memakai `text-end` dan `font-variant-numeric: tabular-nums`.
- Jangan hardcode warna untuk dark mode; gunakan class/variabel CoreUI.

## Ikonografi

Pakai ikon CoreUI:

| Ikon | Penggunaan |
| --- | --- |
| `cilChartLine` | Dashboard |
| `cilMoney` | Pemasukan/transaksi |
| `cilArrowTop` | Pemasukan |
| `cilArrowBottom` | Pengeluaran |
| `cilWallet` | Pembagian budget |
| `cilTag` | Kategori |
| `cilCalendar` | Periode |
| `cilPencil` | Edit |
| `cilTrash` | Hapus |

Jika ikon tidak tersedia di CoreUI free, pilih ikon CoreUI terdekat.

## Responsivitas

- Mobile: kartu menumpuk, tabel scroll horizontal, filter dalam collapse.
- Tablet: dua kolom untuk summary, tabel tetap scroll bila sempit.
- Desktop: summary 4 kartu, tabel penuh, panel alokasi berdampingan.

## Catatan Implementasi

- Modul baru dibuat di `src/views/finance/` dan `src/views/master/`.
- Route baru ditambahkan di `src/routes.js` dengan `React.lazy`.
- Semua request memakai `services/api.js`.
- Jangan hardcode sidebar menu di frontend.
- Tambahkan helper formatter sebelum membuat banyak komponen nominal.
