# Frontend Design - Castra

## 1. Fondasi & Pendekatan Arsitektur

UI Castra mengadopsi arsitektur **Single Page Application (SPA)** berbasis **React 19 + Vite 7 + CoreUI 5 (free)**. Seluruh navigasi, input, dan penyajian data berjalan lancar tanpa reload halaman.

Aplikasi dirancang sebagai alat finansial operasional harian yang cepat, padat, dan intuitif dengan membagi sistem ke dalam 4 pilar utama:
1. **Master** (Data Referensi Dasar)
2. **Pemasukan** (Pencatatan & Riwayat Dana Masuk)
3. **Pengeluaran** (Pencatatan & Riwayat Dana Keluar)
4. **Laporan** (Analitik & Rekapitulasi Keuangan)
*(Didukung modul Dashboard dan Setup Sistem)*

---

## 2. Pola Tata Letak Antarmuka (Layout Patterns)

Aplikasi menggunakan 3 pola layout utama yang konsisten:

### Pola 1: Default Template (Split Layout: Table Kiri + Form Input Kanan)
Digunakan sebagai template standar untuk modul **Master** dan halaman CRUD umum.
```text
┌───────────────────────────────────────┬───────────────────────────────┐
│              KOLOM KIRI               │          KOLOM KANAN          │
│       Grid Table Data (col-lg-7/8)    │     Form Input (col-lg-5/4)   │
├───────────────────────────────────────┼───────────────────────────────┤
│ [Pencarian & Filter]                  │ [Judul Form: Tambah / Edit]   │
│ ┌───────────────────────────────────┐ │ Field 1: [                 ]  │
│ │ Baris 1: Data A    [Edit] [Hapus] │ │ Field 2: [                 ]  │
│ │ Baris 2: Data B    [Edit] [Hapus] │ │ Field 3: [                 ]  │
│ │ Baris 3: Data C    [Edit] [Hapus] │ │                               │
│ └───────────────────────────────────┘ │ [ Batal / Reset ] [ Simpan ]  │
│ [Paginasi & Total Data]               │                               │
└───────────────────────────────────────┴───────────────────────────────┘
```
- **Prinsip Operasional**:
  - Kolom kiri menampilkan daftar data secara dinamis dengan fitur pencarian, filter status, dan paginasi.
  - Kolom kanan selalu menyajikan form input. Pengguna dapat langsung memasukkan data baru tanpa membuka modal atau berpindah halaman.
  - Saat tombol **Edit** pada baris tabel diklik, formulir di kolom kanan terisi otomatis dengan data yang dipilih (mode edit).
  - Tombol **Batal/Reset** mengembalikan formulir ke mode tambah data baru.
  - Pada layar mobile (`< 992px`), layout secara responsif berubah menjadi tumpukan vertikal (Form di atas atau di bawah tabel).

---

### Pola 2: Menu Khusus Transaksi (Konsep Kalender + Modal Input)
Digunakan khusus untuk modul **Pemasukan** dan **Pengeluaran**.
```text
┌───────────────────────────────────────────────────────────────────────┐
│ [ < ]  Oktober 2026  [ > ]           [Toggle: Tampilan Kalender / Tabel]│
├───────┬───────┬───────┬───────┬───────┬───────┬───────────────────────┤
│ SENIN │ SELASA│ RABU  │ KAMIS │ JUMAT │ SABTU │ MINGGU                │
├───────┼───────┼───────┼───────┼───────┼───────┼───────────────────────┤
│ 1     │ 2     │ 3     │ 4     │ 5     │ 6     │ 7                     │
│       │       │•+Rp5jt│       │•-Rp50k│       │                       │
├───────┼───────┼───────┼───────┼───────┼───────┼───────────────────────┤
│ 8     │ 9     │ 10    │ 11    │ 12    │ 13    │ 14                    │
│       │       │ [Klik]───► ┌────────────────────────────────────────┐ │
│       │       │            │ Modal Form Transaksi (Tgl 10 Okt 2026) │ │
│       │       │            │ • Nominal: [ Rp...                   ] │ │
│       │       │            │ • Kategori/Sumber: [ Pilih pos...    ] │ │
│       │       │            │ • Catatan: [                         ] │ │
│       │       │            │ [ Batal ]                 [ Simpan ]   │ │
│       │       │            └────────────────────────────────────────┘ │
└───────┴───────┴───────┴───────┴───────┴───────┴───────────────────────┘
```
- **Prinsip Operasional**:
  - Menyajikan kalender bulanan penuh.
  - Setiap sel tanggal memperlihatkan indikator atau total nominal transaksi pada hari tersebut (hijau untuk pemasukan, merah untuk pengeluaran).
  - **Interaksi Klik Hari**: Pengguna mengklik tanggal tertentu untuk membuka **Modal Form Input** dengan tanggal yang sudah terisi otomatis sesuai sel yang diklik.
  - Jika pada tanggal tersebut sudah ada riwayat transaksi, modal juga menyajikan daftar transaksi hari itu dengan opsi tambah transaksi baru, edit, atau hapus.
  - Tersedia opsi toggle view untuk berpindah ke tampilan tabel list standar bagi pengguna yang ingin melihat riwayat berbasis tabular.

---

### Pola 3: Menu Laporan (Top Row Filter Bar + Bottom Row Full 12-Col Table Grid)
Digunakan khusus untuk modul **Laporan** (Arus Kas, Per Kategori, Realisasi Anggaran, Tren Bulanan).
```text
┌───────────────────────────────────────────────────────────────────────┐
│ ROW ATAS: Filter Bar (Card Penuh)                                     │
│ [ Periode: Bln/Thn ] [ Rentang Tanggal ] [ Kategori ] [ Terapkan ] [ Export ]│
├───────────────────────────────────────────────────────────────────────┤
│ ROW BAWAH: Full Width (12 Column) Data Grid                           │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ Kolom 1   │ Kolom 2      │ Kolom 3        │ Kolom 4      │ Kolom 5│ │
│ ├───────────┼──────────────┼────────────────┼──────────────┼────────┤ │
│ │ ...       │ ...          │ ...            │ ...          │ ...    │ │
│ │ ...       │ ...          │ ...            │ ...          │ ...    │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│ [Ringkasan Total / KPI Baris Bawah]                                   │
└───────────────────────────────────────────────────────────────────────┘
```
- **Prinsip Operasional**:
  - **Row Atas**: Panel filter ringkas dan padat untuk menentukan parameter data (Periode, Tanggal Mulai & Akhir, Kategori/Sumber Dana, tombol Terapkan Filter, serta tombol Ekspor PDF/Excel).
  - **Row Bawah**: Area tabel grid data selebar 12 kolom penuh (`col-12`) agar data pelaporan dapat dibaca secara leluasa tanpa terpotong.
  - Dilengkapi grafik pendukung (opsional di atas tabel atau dalam collapsible panel) seperti Donut Chart pengeluaran atau Bar Chart arus kas bulanan.

---

## 3. Spesifikasi Rinci Antarmuka per Modul

### 3.1 Dashboard
- **Header**: Pemilih periode aktif (Bulan & Tahun).
- **KPI Summary Cards (4 Kartu)**:
  1. Total Saldo / Kas Saat Ini
  2. Total Pemasukan Bulan Ini
  3. Total Pengeluaran Bulan Ini
  4. Arus Kas Bersih (Net Cash Flow: Surplus/Defisit)
- **Komponen Grafik**:
  - Chart Pemasukan vs Pengeluaran 6 bulan terakhir.
  - Donut Chart persentase pengeluaran per kategori bulan aktif.
- **Tabel Cepat**: 5 Transaksi pengeluaran & pemasukan terakhir.

---

### 3.2 Modul Master (Menggunakan Pola Split Layout)

#### A. Master Sumber Dana (`/master/income-sources`)
- **Kolom Kiri (Tabel Data)**:
  - Kolom: Nama Sumber Dana, Keterangan, Status Aktif (Badge), Aksi (Edit, Hapus/Nonaktifkan).
  - Search input & filter status aktif.
- **Kolom Kanan (Form Input)**:
  - Field: Nama Sumber Dana (contoh: Gaji Pokok, Freelance, Bonus), Deskripsi, Checkbox Status Aktif.
  - Tombol Simpan & Batal.

#### B. Master Kategori (`/master/categories`)
- Menggunakan tabs:
  - **Tab 1: Kategori Pengeluaran**
  - **Tab 2: Kategori Pemasukan**
- Di dalam masing-masing tab menerapkan Split Layout:
  - **Kolom Kiri (Tabel)**: Nama Kategori, Pembagian/Alokasi Budget (khusus expense), Estimasi Default (opsional), Status Aktif, Aksi.
  - **Kolom Kanan (Form)**: Nama Kategori, Pilihan Pembagian Budget (khusus expense), Estimasi Anggaran Bulanan Default, Switch Status Aktif.

#### C. Master Alokasi Anggaran (`/master/budget-groups`)
- **Kolom Kiri (Tabel)**: Nama Kelompok Budget (Need, Fun, Saving, Emergency), Kode, Persentase Default (%), Status.
- **Kolom Kanan (Form)**: Nama Kelompok, Kode, Persentase, Urutan Tampil. Indikator total persentase kelompok utama wajib 100%.

---

### 3.3 Modul Pemasukan (`/incomes`) - Konsep Kalender & Modal Form
- **Toolbar Atas**:
  - Navigator Bulan/Tahun (`<` Bulan Ini `>`).
  - Total ringkasan pemasukan periode terpilih.
  - Tombol aksi: "Tambah Pemasukan" (membuka modal form) & Toggle Switch (Kalender / Tabel).
- **Tampilan Utama (Kalender)**:
  - Grid kalender 7 hari x minggu.
  - Sel hari menampilkan tanggal dan chip/badge nominal pemasukan hijau (contoh: `+Rp 4.500.000`).
  - Klik pada tanggal langsung membuka **Modal Form Pemasukan**:
    - Tanggal (terisi otomatis sesuai hari yang diklik).
    - Sumber Dana (dropdown dari Master Sumber Dana).
    - Nominal (input uang format IDR).
    - Catatan/Keterangan.
    - Riwayat transaksi pada tanggal tersebut (jika sudah ada data).
- **Tampilan Alternatif (Tabel)**:
  - Grid tabel seluruh pemasukan bulan terpilih dengan paginasi, pencarian, dan tombol aksi per baris.

---

### 3.4 Modul Pengeluaran (`/expenses`) - Konsep Kalender & Modal Form
- **Toolbar Atas**:
  - Navigator Bulan/Tahun.
  - Total pengeluaran bulan terpilih & sisa anggaran total.
  - Tombol aksi: "Tambah Pengeluaran" & Toggle Switch (Kalender / Tabel).
- **Tampilan Utama (Kalender)**:
  - Sel hari menampilkan tanggal dan chip/badge nominal pengeluaran merah (contoh: `-Rp 120.000`).
  - Klik pada tanggal membuka **Modal Form Pengeluaran**:
    - Tanggal (terisi otomatis).
    - Kategori Pengeluaran (dropdown dari Master Kategori).
    - Nominal (input angka positif).
    - Sumber Dana / Metode Pembayaran (opsional jika mengaitkan ke kas/rekening).
    - Catatan.
    - Indikator status sisa budget kategori terpilih.
- **Tampilan Alternatif (Tabel)**:
  - Grid tabel seluruh pengeluaran dengan filter kategori, rentang tanggal, status budget (Aman, Mendekati Batas, Over Budget).

---

### 3.5 Modul Laporan (`/reports/*`) - Pola 12-Col Data Grid

#### A. Laporan Arus Kas (`/reports/cash-flow`)
- **Row Atas (Filter)**: Pilihan Tahun, Filter Rentang Bulan, Tombol Export Excel / PDF.
- **Row Bawah (Full 12-Col Table)**:
  - Kolom: Bulan, Total Pemasukan (+), Total Pengeluaran (-), Arus Kas Bersih (Net), Status (Surplus/Defisit), Persentase Tabungan/Tersisa.
  - Baris Total / Akumulasi di bagian paling bawah tabel.

#### B. Laporan Pengeluaran per Kategori (`/reports/by-category`)
- **Row Atas (Filter)**: Pilihan Periode Bulan & Tahun, Filter Kelompok Budget.
- **Row Bawah (Full 12-Col Table & Visualisasi)**:
  - Visualisasi ringkas Donut/Bar Chart di sisi atas atau kiri tabel.
  - Tabel 12 kolom: Kategori, Kelompok Budget, Anggaran/Estimasi, Realisasi Aktual, Selisih (Sisa), % Pemakaian, Status (Aman / Mendekati Batas / Over Budget).

#### C. Laporan Realisasi Anggaran (`/reports/budget-vs-actual`)
- **Row Atas (Filter)**: Periode Bulan/Tahun, Status Filter (Semua / Over Budget Saja).
- **Row Bawah (Full 12-Col Table)**:
  - Tabel lengkap dengan visual progress bar CoreUI di dalam kolom realisasi (misal: Hijau `<80%`, Kuning `80-100%`, Merah `>100%`).

#### D. Laporan Tren Historis (`/reports/trends`)
- **Row Atas (Filter)**: Rentang Waktu (3 Bulan, 6 Bulan, 1 Tahun, Kustom).
- **Row Bawah (Full 12-Col Grid)**:
  - Grafik tren pengeluaran vs pemasukan multi-garis.
  - Tabel rincian tren per bulan.

---

## 4. Standar Visual, Warna & Format Data

### 4.1 Warna Status Transaksi & Finansial
- **Pemasukan**: Hijau (`text-success` / `bg-success`), format `+Rp X.XXX.XXX`.
- **Pengeluaran**: Merah (`text-danger` / `bg-danger`), format `-Rp X.XXX.XXX`.
- **Status Budget**:
  - `Aman` (`safe`): Badge `success`
  - `Mendekati Batas` (`near_limit`): Badge `warning`
  - `Over Budget` (`over_budget`): Badge `danger`
- **Surplus / Defisit**:
  - Surplus: `text-success`
  - Defisit: `text-danger`

### 4.2 Formatting Reusable
- Mata Uang: `new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })`.
- Angka pada tabel selalu rata kanan (`text-end`) dengan CSS `font-variant-numeric: tabular-nums`.
- Format tanggal kirim ke API: `YYYY-MM-DD`.
- Format tanggal tampilan UI: `DD MMMM YYYY` (locale Indonesia).

### 4.3 Navigasi & Sidebar
- Navigasi sidebar dinamis bersumber dari payload backend `navigation` di Redux store.
- Struktur Menu Baru di Sidebar:
  1. `Dashboard`
  2. `Master` (`Sumber Dana`, `Kategori`, `Alokasi Anggaran`)
  3. `Pemasukan`
  4. `Pengeluaran`
  5. `Laporan` (`Arus Kas`, `Per Kategori`, `Realisasi Anggaran`, `Tren Bulanan`)
  6. `Setup` (`Company`, `Users`, `Roles`, `Menus`, `Role Permissions`, `Change Password`)
