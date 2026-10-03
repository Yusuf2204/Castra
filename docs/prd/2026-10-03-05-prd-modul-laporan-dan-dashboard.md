# PRD 05: Modul Laporan (Reports) & Pembaruan Dashboard 4 Pilar

**Tanggal:** 2026-10-03  
**Nomor Dokumen:** 2026-10-03-05  
**Status:** SELESAI (COMPLETED)  
**Tautan Dokumen Terkait:**  
- [PRD 01 Planning Perubahan Konsep](2026-10-03-01-planning-perubahan-konsep.md)  
- [PRD 02 Master Data Refactoring](2026-10-03-02-prd-master-kategori-dan-budget-groups.md)  
- [PRD 03 Modul Pemasukan](2026-10-03-03-prd-modul-pemasukan.md)  
- [PRD 04 Modul Pengeluaran](2026-10-03-04-prd-modul-pengeluaran.md)  
- [Backend Design Guide](../backend/design.md)  
- [Frontend Design Guide](../frontend/design.md)  

---

## 1. Ringkasan Eksekutif

Dokumen ini mendefinisikan spesifikasi teknis pelaksanaan **Tahap 5** dari roadmap Castra: pembangunan modul **Laporan (Reports)** dan pembaruan **Dashboard** utama. Tahap ini melengkapi 4 pilar aplikasi Castra: **Master**, **Pemasukan**, **Pengeluaran**, dan **Laporan**.

Tujuan utama:
1. Menerapkan tabel rekapitulasi ber-prefix **`rpt_`** dengan `rpt_monthly_summaries` untuk mencatat agregasi bulanan secara terstruktur dan efisien.
2. Membangun API Backend Laporan (`/api/reports/cash-flow`, `/api/reports/budget-comparison`, `/api/reports/category-breakdown`) dan pembaruan `/api/dashboard-summary`.
3. Membangun antarmuka frontend **Pola 3: Menu Laporan (Top Row Filter Bar + Bottom Row Full 12-Col Table Grid)** dengan sub-navigasi laporan:
   - **Arus Kas Bulanan** (*Cash Flow*): Arus kas per bulan dalam setahun (Pemasukan, Pengeluaran, Saldo Bersih, Saldo Kumulatif).
   - **Realisasi Anggaran** (*Budget vs Actual*): Perbandingan estimasi vs pengeluaran aktual per kategori dengan indikator status (*safe*, *near_limit*, *over_budget*).
   - **Rincian Kategori** (*Category Breakdown*): Pengelompokan pengeluaran berdasarkan Kelompok Anggaran (*Need*, *Fun*, *Saving*, *Emergency*) dan persentasenya.
4. Memperbarui antarmuka **Dashboard** utama agar menampilkan kartu KPI keuangan (*Net Balance*, Pemasukan Bulan Ini, Pengeluaran Bulan Ini, Realisasi Anggaran) dan riwayat transaksi terkini.
5. Menyediakan pengujian otomatis backend (PHPUnit) dan verifikasi frontend (ESLint & Vite build).

---

## 2. Rincian Skema Database & Migrasi Baru

Aturan integritas data: **Dilarang memodifikasi migrasi lama**. Seluruh perubahan dilakukan melalui berkas migrasi baru.

### 2.1 File Migrasi Baru: `2026_10_03_170000_create_rpt_monthly_summaries_table.php`

Struktur tabel `rpt_monthly_summaries`:
- `id` (bigint unsigned, primary key, auto increment)
- `user_id` (bigint unsigned, foreign key ke `users.id`, onDelete cascade)
- `year` (smallint unsigned)
- `month` (tinyint unsigned, 1..12)
- `total_income` (decimal 15,2, default 0.00)
- `total_expense` (decimal 15,2, default 0.00)
- `net_balance` (decimal 15,2, default 0.00)
- `created_at`, `updated_at` (timestamps)

Indeks optimasi:
- `unique(['user_id', 'year', 'month'])` untuk mencegah duplikasi agregasi per bulan.

---

## 3. Spesifikasi Backend (Models, Services, Controllers)

### 3.1 Model Eloquent: `App\Models\MonthlySummary`
- Tabel: `protected $table = 'rpt_monthly_summaries';`
- Fillable: `['user_id', 'year', 'month', 'total_income', 'total_expense', 'net_balance']`
- Casts:
  - `year` $\rightarrow$ `integer`
  - `month` $\rightarrow$ `integer`
  - `total_income` $\rightarrow$ `float`
  - `total_expense` $\rightarrow$ `float`
  - `net_balance` $\rightarrow$ `float`
- Relasi:
  - `user()` $\rightarrow$ `belongsTo(User::class)`

### 3.2 Service: `App\Services\ReportService`
Tugas:
1. `getMonthlyCashFlow(User $user, int $year)`:
   - Mengambil total pemasukan dari `in_transactions` dan pengeluaran dari `out_transactions` untuk 12 bulan (Jan-Des).
   - Menghitung Saldo Bersih per bulan dan Akumulasi Saldo Kumulatif (*Cumulative Balance*).
   - Menyimpan/memperbarui rekap ke `rpt_monthly_summaries`.
2. `getBudgetComparison(User $user, string $monthStr)`:
   - Mengambil seluruh kategori pengeluaran (`type = 'expense'`).
   - Menghitung total pengeluaran aktual per kategori untuk bulan tersebut.
   - Menghitung persentase pemakaian (`actual / monthly_estimate * 100`).
   - Menentukan status:
     - `safe`: pemakaian $\le 80\%$ (warna hijau)
     - `near_limit`: pemakaian $> 80\%$ dan $\le 100\%$ (warna kuning/warning)
     - `over_budget`: pemakaian $> 100\%$ (warna merah/danger)
3. `getCategoryBreakdown(User $user, string $monthStr)`:
   - Mengelompokkan pengeluaran berdasarkan kelompok anggaran (*ms_budget_groups*: Need, Fun, Saving, Emergency).
   - Menghitung total per kelompok dan persentase terhadap total pengeluaran bulan tersebut.
4. `getDashboardSummary(User $user)`:
   - Total pemasukan bulan ini, total pengeluaran bulan ini, saldo bersih bulan ini.
   - Total pemasukan & pengeluaran sepanjang masa (*All-Time Net Balance*).
   - Realisasi anggaran bulan ini (total estimasi vs total aktual).
   - 5 transaksi pemasukan terkini dan 5 transaksi pengeluaran terkini.

### 3.3 Controller: `App\Http\Controllers\Api\ReportController`
Endpoints (diproteksi `auth:sanctum`):
- `GET /api/reports/cash-flow?year=YYYY`
- `GET /api/reports/budget-comparison?month=YYYY-MM`
- `GET /api/reports/category-breakdown?month=YYYY-MM`

### 3.4 Pembaruan Controller: `App\Http\Controllers\Api\DashboardController`
- Endpoint `GET /api/dashboard-summary` diperkaya dengan ringkasan keuangan personal 4 pilar di samping data ringkasan sistem.

---

## 4. Desain Antarmuka Pengguna Frontend (Pola 3: Menu Laporan)

Direktori: `frontend/src/views/reports/`
- `Reports.js` (Halaman utama container dengan Pola 3: Row Atas Filter & Sub-Navigasi, Row Bawah Full 12-Col Table Grid)
- `CashFlowReport.js` (Tabel arus kas 12 bulan dengan ringkasan total pemasukan, pengeluaran, saldo bersih, saldo kumulatif)
- `BudgetComparisonReport.js` (Tabel perbandingan estimasi vs aktual per kategori dengan badge status safe/near_limit/over_budget)
- `CategoryBreakdownReport.js` (Tabel pengelompokan pengeluaran per kelompok anggaran Need/Fun/Saving dan rincian kategori)

Pembaruan Dashboard:
- `frontend/src/views/dashboard/Dashboard.js` diperbarui menyajikan:
  - 4 KPI Card: **Saldo Bersih**, **Pemasukan Bulan Ini**, **Pengeluaran Bulan Ini**, **Realisasi Anggaran**.
  - 2 Grid Kolom Bawah: Riwayat Transaksi Pemasukan Terkini & Riwayat Transaksi Pengeluaran Terkini.
  - Ringkasan sistem admin jika user memiliki role admin.

---

## 5. Rencana Pengujian (Testing Suite)

1. **Feature Test Backend (`tests/Feature/ReportTest.php`)**:
   - `test_cash_flow_report_returns_monthly_totals_and_cumulative_balance`
   - `test_budget_comparison_evaluates_safe_near_limit_and_over_budget_status`
   - `test_category_breakdown_aggregates_by_budget_group`
   - `test_dashboard_summary_returns_financial_kpi_for_authenticated_user`
   - `test_reports_are_isolated_per_user`
2. **Frontend Lint & Build**:
   - `npm run lint` lolos tanpa error.
   - `npm run build` berhasil membangun bundel produksi.

---

## 6. Checklist Eksekusi Langkah Kerja

- [x] **Langkah 1**: Buat berkas migrasi `2026_10_03_170000_create_rpt_monthly_summaries_table.php` dan jalankan `php artisan migrate`.
- [x] **Langkah 2**: Buat model `MonthlySummary` dan service `ReportService`.
- [x] **Langkah 3**: Buat `ReportController` dan perbarui `DashboardController`. Daftarkan routes di `routes/api.php`.
- [x] **Langkah 4**: Buat dan jalankan test PHPUnit `ReportTest.php` hingga seluruh test berstatus hijau.
- [x] **Langkah 5**: Bangun komponen Frontend Modul Laporan (`Reports.js`, `CashFlowReport.js`, `BudgetComparisonReport.js`, `CategoryBreakdownReport.js`) dan perbarui `Dashboard.js`.
- [x] **Langkah 6**: Daftarkan rute `/reports` di `frontend/src/routes.js` dan tambahkan menu Laporan pada seeder `MenuSeeder.php` serta `RoleMenuSeeder.php`.
- [x] **Langkah 7**: Jalankan verifikasi build frontend dan pastikan seluruh test suite backend tetap hijau.
