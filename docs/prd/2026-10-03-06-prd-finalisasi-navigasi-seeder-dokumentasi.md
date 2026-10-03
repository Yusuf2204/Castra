# PRD: Finalisasi Navigasi, Seeder, dan Dokumentasi (Tahap 6)

- **Tanggal**: 2026-10-03
- **Nomor Dokumen**: `2026-10-03-06-prd-finalisasi-navigasi-seeder-dokumentasi.md`
- **Status**: Selesai (Completed)
- **Modul**: Navigasi Dinamis, Seeder, Dokumentasi Proyek & Final QA

---

## 1. Latar Belakang & Tujuan

Setelah Tahap 1 hingga Tahap 5 selesai dieksekusi (fondasi arsitektur, Master Data, Modul Pemasukan, Modul Pengeluaran, serta Modul Laporan & Dashboard Analytics), Tahap 6 merupakan fase finalisasi untuk:
1. Menyempurnakan struktur menu navigasi dinamis pada basis data agar mencerminkan 4 pilar keuangan: **Master**, **Pemasukan**, **Pengeluaran**, dan **Laporan Keuangan**.
2. Memperbarui dokumen panduan sistem ([agent.md](file:///var/www/html/Castra/agent.md), [README.md](file:///var/www/html/Castra/README.md), dan dokumentasi teknis di `docs/`) agar mencerminkan arsitektur sistem terbaru.
3. Melakukan isolasi testing PHPUnit pada SQLite in-memory dan verifikasi seluruh unit/feature test backend, linting, serta kompilasi produksi frontend.

---

## 2. Struktur Navigasi Menu & Hak Akses

Hierarki menu aplikasi pada `menus` dan `role_menus`:

| No | Nama Menu | Route / Path | Parent | Icon | Order |
|---|---|---|---|---|---|
| 1 | **Dashboard** | `/dashboard` | Root | `cilSpeedometer` | 1 |
| 2 | **Master** | `#` (Dropdown) | Root | `cilLayers` | 2 |
| 2.1 | Sumber Dana | `/master/income-sources` | Master | `cil-wallet` | 1 |
| 2.2 | Kategori | `/master/categories` | Master | `cil-tags` | 2 |
| 2.3 | Alokasi Anggaran | `/master/budget-groups` | Master | `cil-chart-pie` | 3 |
| 3 | **Pemasukan** | `/incomes` | Root | `cilArrowTop` | 3 |
| 4 | **Pengeluaran** | `/expenses` | Root | `cilArrowBottom` | 4 |
| 5 | **Laporan** | `/reports` | Root | `cilChartPie` | 5 |
| 6 | **Setup** | `#` (Dropdown) | Root | `cilSettings` | 6 |
| 6.1 | Company | `/setup/company` | Setup | `cil-building` | 1 |
| 6.2 | Users | `/setup/users` | Setup | `cil-people` | 2 |
| 6.3 | Roles | `/setup/roles` | Setup | `cil-shield-alt` | 3 |
| 6.4 | Menus | `/setup/menus` | Setup | `cil-list` | 4 |
| 6.5 | Role Permissions | `/setup/role-permissions` | Setup | `cil-lock-locked` | 5 |
| 6.6 | Change Password | `/setup/change-password` | Setup | `cil-key` | 6 |

---

## 3. Rencana Pembaruan Dokumentasi

1. **[agent.md](file:///var/www/html/Castra/agent.md)**:
   - Menyesuaikan daftar menu minimal dan arsitektur 4 pilar (`Master`, `Pemasukan`, `Pengeluaran`, `Laporan`).
   - Memperbarui aturan domain: relasi `ms_categories` (tipe expense memiliki budget group), `in_transactions` (memiliki income source), dan `out_transactions` (murni terhubung ke kategori tanpa income source).
2. **[README.md](file:///var/www/html/Castra/README.md)**:
   - Memastikan informasi endpoint API, struktur modul, alur deployment Docker, dan testing suite terdokumentasi lengkap dan terkini.
3. **Dokumentasi PRD**:
   - Memastikan checklist di seluruh berkas PRD Tahap 1 - 6 terisi lengkap dan konsisten.

---

## 4. Rencana Pengujian & Quality Assurance

1. **Backend Test Suite (PHPUnit)**:
   - Seluruh pengujian: `php artisan test` terisolasi pada SQLite memory agar tidak me-reset database MySQL development.
2. **Backend Code Style (Laravel Pint)**:
   - Format PSR-12 kode backend dengan `./vendor/bin/pint`.
3. **Frontend Linting & Build**:
   - `npm run lint` untuk memastikan kepatuhan ESLint/Prettier.
   - `npm run build` untuk memverifikasi bundel Vite siap produksi.
   - Sinkronisasi build statis ke container `castra-frontend`.

---

## 5. Checklist Eksekusi Langkah Kerja

- [x] **Langkah 1**: Periksa dan sempurnakan `MenuSeeder.php` dan `RoleMenuSeeder.php`, buat `BudgetGroupSeeder.php`, lalu jalankan seeder di container backend.
- [x] **Langkah 2**: Perbarui `agent.md` dengan spesifikasi 4 pilar, struktur domain, dan menu navigasi terbaru.
- [x] **Langkah 3**: Periksa dan perbarui `README.md` utama di root repositori.
- [x] **Langkah 4**: Jalankan format kode Laravel Pint di backend.
- [x] **Langkah 5**: Jalankan pengujian PHPUnit (`php artisan test`) untuk seluruh modul.
- [x] **Langkah 6**: Jalankan linting dan build frontend, lalu salin ke container web server.
- [x] **Langkah 7**: Verifikasi integrasi menyeluruh dan finalisasi roadmap di PRD 01 & PRD 06.
