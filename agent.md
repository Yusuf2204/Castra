# Agent Guidelines - Castra

Castra adalah aplikasi pencatatan dan perencanaan keuangan pribadi modern berbasis **Laravel 12** dan **React 19**.
Aplikasi ini dibangun di atas 4 pilar utama: **Master**, **Pemasukan**, **Pengeluaran**, dan **Laporan Keuangan**.

## Konteks Produk & Filosofi

Referensi historis awal berasal dari konsep envelope budgeting `docs/Keuangan_September_2026.xlsx`.
Castra memisahkan fungsi spreadsheet menjadi modul web transaksional modern yang modular:

- **Pemasukan (`in_`)**: Titik awal arus kas. Setiap uang masuk dicatat berdasarkan sumber dana (`ms_income_sources`) dan kategori pemasukan.
- **Pengeluaran (`out_`)**: Catatan pemakaian harian. Pengeluaran diklasifikasikan ke dalam kategori (`ms_categories` tipe `expense`) yang berada di bawah amplop alokasi anggaran (`ms_budget_groups`). Pengeluaran **tidak** terikat dengan sumber dana.
- **Master (`ms_`)**: Data referensi mandiri untuk sumber dana, kategori pos transaksi, dan alokasi anggaran bulanan.
- **Laporan (`rpt_`)**: Rekapitulasi agregasi arus kas bulanan, perbandingan realisasi terhadap estimasi anggaran, dan rincian alokasi.

## Istilah Domain

| Istilah | Tabel Terkait | Makna |
| --- | --- | --- |
| Sumber Dana | `ms_income_sources` | Asal atau kanal uang masuk (contoh: Gaji, Bonus, Freelance, Dividen) |
| Kategori | `ms_categories` | Pos transaksi untuk pemasukan (`income`) atau pengeluaran (`expense`) |
| Alokasi Anggaran | `ms_budget_groups` | Kelompok amplop anggaran (default: Need, Fun, Saving, Emergency) |
| Pemasukan | `in_transactions` | Riwayat transaksi dana masuk aktual per tanggal |
| Pengeluaran | `out_transactions` | Riwayat transaksi dana keluar harian aktual per tanggal |
| Ringkasan Bulanan | `rpt_monthly_summaries` | Agregasi total pemasukan, total pengeluaran, dan arus kas bersih bulanan |
| Realisasi Anggaran | API Report | Perbandingan antara batas estimasi anggaran kategori vs aktual pengeluaran |

## Struktur Menu Navigasi Castra

Menu aplikasi diatur secara hierarkis melalui `menus` dan `role_menus`:

1. `Dashboard` (`/dashboard`) - Ringkasan finansial (Net Cash Flow, Total Incomes, Total Expenses, Realisasi Anggaran), transaksi terkini, dan status sesi/sistem.
2. `Master`
   - `Sumber Dana` (`/master/income-sources`)
   - `Kategori` (`/master/categories`)
   - `Alokasi Anggaran` (`/master/budget-groups`)
3. `Pemasukan` (`/incomes`) - Tampilan kalender interaktif uang masuk & modal form pencatatan pemasukan.
4. `Pengeluaran` (`/expenses`) - Tampilan kalender interaktif uang keluar & modal form pencatatan pengeluaran.
5. `Laporan` (`/reports`) - Arus Kas 12 bulan, Perbandingan Realisasi Anggaran, dan Rincian Beban Kategori.
6. `Setup`
   - `Company` (`/setup/company`)
   - `Users` (`/setup/users`)
   - `Roles` (`/setup/roles`)
   - `Menus` (`/setup/menus`)
   - `Role Permissions` (`/setup/role-permissions`)
   - `Change Password` (`/setup/change-password`)

## Logika & Aturan Bisnis Inti

1. **Pencatatan Pemasukan**:
   - Memerlukan `income_source_id` yang valid milik user aktif.
   - Kolom `category_id` bersifat opsional (harus bertipe `income`).
   - Nominal `amount` selalu bernilai positif.
2. **Pencatatan Pengeluaran**:
   - Memerlukan `category_id` yang valid milik user aktif dengan tipe `expense`.
   - **TIDAK** memiliki `income_source_id` (pengeluaran murni diklasifikasikan berdasarkan kategori pos belanja).
   - Nominal `amount` selalu bernilai positif di database dan API.
3. **Kategori & Alokasi Anggaran**:
   - Kategori pengeluaran (`expense`) wajib terhubung ke salah satu `budget_group_id`.
   - Kategori pemasukan (`income`) tidak memiliki `budget_group_id` (`null`).
   - Setiap kategori pengeluaran memiliki `monthly_estimate` sebagai acuan batas anggaran bulanan.
4. **Evaluasi Status Anggaran**:
   - `Aman` (`safe`): Pemakaian actual <= 80% dari estimasi.
   - `Mendekati Batas` (`near_limit`): Pemakaian actual antara 80% s.d. 100% dari estimasi.
   - `Over Budget` (`over_budget`): Pemakaian actual > 100% dari estimasi (melebihi estimasi).

## Aturan Kerja Agen & Arsitektur

- **Stack Baseline**: Backend Laravel 12 / PHP 8.3+, Frontend React 19 / Vite 7 / CoreUI 5.
- **Prefix Tabel**:
  - `ms_` untuk Master data.
  - `in_` untuk Pemasukan.
  - `out_` untuk Pengeluaran.
  - `rpt_` untuk Laporan / Ringkasan.
- **Isolasi Pengguna**: Seluruh query, mutasi data, dan laporan **wajib** di-scope ke pengguna yang sedang login (`$user->id`).
- **Response Format**: Konsisten menggunakan envelope JSON `{ "data": ..., "message": "...", "errors": null }`.
- **Standar Bahasa**: Kode, route, model, tabel, dan simbol memakai bahasa Inggris. Label UI dan teks dokumen memakai bahasa Indonesia.
- **Testing & Kualitas**: Setiap perubahan backend harus disertai pengujian di `tests/Feature/` (PHPUnit), format kode dengan `pint`, dan build frontend lolos `eslint` dan `vite build`.
