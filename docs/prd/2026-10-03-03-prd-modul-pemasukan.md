# PRD 03: Modul Pemasukan (Incomes) & Antarmuka Kalender Interaktif

**Tanggal:** 2026-10-03  
**Nomor Dokumen:** 2026-10-03-03  
**Status:** PROPOSED FOR IMPLEMENTATION (Tahap 3)  
**Tautan Dokumen Terkait:**  
- [PRD 01 Planning Perubahan Konsep](2026-10-03-01-planning-perubahan-konsep.md)  
- [PRD 02 Master Data Refactoring](2026-10-03-02-prd-master-kategori-dan-budget-groups.md)  
- [Backend Design Guide](../backend/design.md)  
- [Frontend Design Guide](../frontend/design.md)  

---

## 1. Ringkasan Eksekutif

Dokumen ini mendefinisikan spesifikasi teknis pelaksanaan **Tahap 3** dari roadmap Castra: pembangunan modul **Pemasukan (Incomes)**. Modul ini merupakan pilar kedua dari 4 pilar arsitektur aplikasi (Master, Pemasukan, Pengeluaran, Laporan).

Tujuan utama:
1. Menerapkan skema database ber-prefix **`in_`** dengan tabel `in_transactions` untuk mencatat seluruh arus kas masuk.
2. Membangun API Backend (`/api/incomes`) lengkap dengan endpoint data transaksi dan endpoint agregasi harian (`/api/incomes/calendar`) untuk mendukung antarmuka kalender.
3. Membangun antarmuka frontend **Pola 2: Menu Khusus Transaksi (Monthly Calendar Grid + Modal Input Harian)** dengan opsi toggle ke **Tampilan Tabel List**.
4. Mengintegrasikan transaksi pemasukan dengan **Master Sumber Dana** (`ms_income_sources`) dan **Master Kategori Pemasukan** (`ms_categories` type `income`).
5. Menyediakan pengujian otomatis backend (PHPUnit) dan frontend (ESLint & Vite build).

---

## 2. Rincian Skema Database & Migrasi Baru

Aturan integritas data: **Dilarang memodifikasi migrasi lama**. Pembuatan tabel dilakukan melalui file migrasi baru.

### 2.1 File Migrasi Baru: `2026_10_03_150000_create_in_transactions_table.php`

Struktur tabel `in_transactions`:
- `id` (bigint unsigned, primary key, auto increment)
- `user_id` (bigint unsigned, foreign key ke `users.id`, onDelete cascade)
- `income_source_id` (bigint unsigned, foreign key ke `ms_income_sources.id`, onDelete restrict)
- `category_id` (bigint unsigned nullable, foreign key ke `ms_categories.id`, onDelete set null)
- `transaction_date` (date, indexed)
- `amount` (decimal 15,2, unsigned / nilai selalu positif)
- `notes` (text nullable / catatan transaksi)
- `created_at`, `updated_at` (timestamps)

Indeks optimasi:
- `index(['user_id', 'transaction_date'])` untuk query filter kalender bulanan dan laporan.
- `index(['user_id', 'income_source_id'])` untuk query filter berdasarkan sumber dana.

---

## 3. Spesifikasi Backend (Models, Resources, Controllers)

### 3.1 Model Eloquent: `App\Models\IncomeTransaction`
- Tabel: `protected $table = 'in_transactions';`
- Fillable: `['user_id', 'income_source_id', 'category_id', 'transaction_date', 'amount', 'notes']`
- Casts:
  - `transaction_date` $\rightarrow$ `date:Y-m-d`
  - `amount` $\rightarrow$ `float` (atau decimal)
- Relasi:
  - `user()` $\rightarrow$ `belongsTo(User::class)`
  - `incomeSource()` $\rightarrow$ `belongsTo(IncomeSource::class, 'income_source_id')`
  - `category()` $\rightarrow$ `belongsTo(Category::class, 'category_id')`

### 3.2 Resource: `App\Http\Resources\IncomeTransactionResource`
Format JSON:
```json
{
  "id": 1,
  "user_id": 1,
  "transaction_date": "2026-10-01",
  "amount": 5000000.0,
  "notes": "Gaji bulanan Oktober",
  "income_source_id": 2,
  "income_source": {
    "id": 2,
    "name": "Rekening Payroll BCA"
  },
  "category_id": 5,
  "category": {
    "id": 5,
    "name": "Gaji Utama",
    "type": "income"
  },
  "created_at": "2026-10-01T08:00:00.000000Z",
  "updated_at": "2026-10-01T08:00:00.000000Z"
}
```

### 3.3 Endpoints API: `App\Http\Controllers\Api\IncomeController`

Semua endpoint diproteksi oleh middleware `auth:sanctum` dan di-scope ke `$request->user()`.

1. **`GET /api/incomes`**:
   - Query params:
     - `month`: format `YYYY-MM` (opsional, memfilter tanggal transaksi dalam bulan tersebut)
     - `start_date`: format `YYYY-MM-DD` (opsional)
     - `end_date`: format `YYYY-MM-DD` (opsional)
     - `income_source_id`: bigint (opsional)
     - `category_id`: bigint (opsional)
     - `search`: string (mencari dalam `notes`)
     - `page`: default 1
     - `per_page`: default 15
   - Return: paginated data dengan eager loading `incomeSource` dan `category`.

2. **`GET /api/incomes/calendar`**:
   - Query params:
     - `month`: required, format `YYYY-MM` (contoh: `2026-10`)
     - `income_source_id`: opsional
   - Response:
     - Ringkasan akumulasi harian untuk render kalender:
     ```json
     {
       "data": {
         "month": "2026-10",
         "total_month": 12500000.0,
         "transaction_count": 4,
         "days": {
           "2026-10-01": {
             "total": 10000000.0,
             "count": 1,
             "items": [...]
           },
           "2026-10-05": {
             "total": 2500000.0,
             "count": 2,
             "items": [...]
           }
         }
       },
       "message": "Data kalender pemasukan berhasil diambil"
     }
     ```

3. **`POST /api/incomes`**:
   - Payload:
     - `transaction_date`: required, date_format `Y-m-d`
     - `amount`: required, numeric, min:1
     - `income_source_id`: required, exists:ms_income_sources,id (milik user login)
     - `category_id`: nullable, exists:ms_categories,id (milik user login dan type `income`)
     - `notes`: nullable, string, max:500
   - Return: 201 Created + single resource.

4. **`GET /api/incomes/{id}`**: Detail transaksi milik user login.
5. **`PUT /api/incomes/{id}`**: Update transaksi milik user login.
6. **`DELETE /api/incomes/{id}`**: Hapus transaksi milik user login.

---

## 4. Desain Antarmuka Pengguna Frontend (Pola 2: Transaksi Kalender)

Direktori: `frontend/src/views/incomes/`
- `Incomes.js` (Halaman utama container & switcher kalender/tabel)
- `IncomeCalendar.js` (Grid Kalender Bulanan interaktif)
- `IncomesTable.js` (Tampilan Tabel List konvensional dengan filter & pagination)
- `IncomeModal.js` (Modal Form Input / Edit / Riwayat Transaksi per hari)

### 4.1 Logika & Alur Kalender Interaktif
1. **Header Kalender**:
   - Navigasi bulan: tombol `<` (Bulan Sebelumnya), nama Bulan & Tahun (contoh: `Oktober 2026`), tombol `>` (Bulan Berikutnya), dan tombol `Hari Ini`.
   - Ringkasan header: Total Pemasukan Bulan Tersebut (format Rupiah tebal, warna hijau).
   - Tombol Switcher Tampilan: **Kalender** vs **Tabel List**.
   - Tombol **+ Tambah Pemasukan**: Membuka modal input dengan default tanggal hari ini.
2. **Grid Kalender (7 Kolom: Sen, Sel, Rab, Kam, Jum, Sab, Min)**:
   - Setiap kotak tanggal menampilkan nomor tanggal.
   - Jika ada transaksi pada tanggal tersebut:
     - Kotak tanggal memiliki highlight warna lembut.
     - Ditampilkan badge nominal pemasukan: contoh `+ Rp 5.000.000` dan jumlah transaksi.
   - **Interaksi Klik Kotak Tanggal**:
     - Mengklik kotak tanggal akan membuka **`IncomeModal`** untuk tanggal yang diklik.
3. **Modal Input & Riwayat Transaksi Hari Tersebut (`IncomeModal.js`)**:
   - Judul modal: `Pemasukan - [Format Tanggal, contoh: 1 Oktober 2026]`.
   - Jika sudah ada transaksi pada hari itu:
     - Ditampilkan daftar item transaksi hari itu di bagian atas modal (Sumber Dana, Kategori, Nominal, Catatan, tombol Edit, tombol Hapus).
   - Di bagian bawah modal terdapat formulir input / edit:
     - Tanggal (otomatis terkunci atau dapat diubah).
     - Dropdown Sumber Dana (`ms_income_sources`).
     - Dropdown Kategori Pemasukan (`ms_categories` type `income`).
     - Input Nominal (Rupiah).
     - Input Catatan.
     - Tombol Simpan Transaksi.
   - Setelah simpan/hapus, modal dan data kalender otomatis ter-refresh secara real-time.

---

## 5. Rencana Pengujian (Testing Suite)

1. **Feature Test Backend (`tests/Feature/IncomeTransactionTest.php`)**:
   - `test_user_can_create_income_transaction`
   - `test_income_transaction_requires_valid_income_source_and_positive_amount`
   - `test_user_can_only_use_their_own_income_sources_and_categories`
   - `test_category_must_be_income_type`
   - `test_user_can_retrieve_paginated_incomes_with_filters`
   - `test_calendar_endpoint_returns_aggregated_daily_totals_for_given_month`
   - `test_user_can_update_their_own_income_transaction`
   - `test_user_can_delete_their_own_income_transaction`
   - `test_user_cannot_access_or_modify_other_users_income`
2. **Frontend Lint & Build**:
   - `npm run lint` lolos tanpa error.
   - `npm run build` berhasil membangun bundel produksi.

---

## 6. Checklist Eksekusi Langkah Kerja

- [x] **Langkah 1**: Buat berkas migrasi `2026_10_03_150000_create_in_transactions_table.php` dan jalankan `php artisan migrate`.
- [x] **Langkah 2**: Buat model `IncomeTransaction`, factory `IncomeTransactionFactory`, dan resource `IncomeTransactionResource`.
- [x] **Langkah 3**: Buat `IncomeController` dengan method `index`, `calendar`, `store`, `show`, `update`, `destroy` beserta anotasi Swagger OpenAPI. Daftarkan routes di `routes/api.php`.
- [x] **Langkah 4**: Buat dan jalankan test PHPUnit `IncomeTransactionTest.php` hingga seluruh test berstatus hijau.
- [x] **Langkah 5**: Bangun komponen Frontend Modul Pemasukan (`Incomes.js`, `IncomeCalendar.js`, `IncomesTable.js`, `IncomeModal.js`).
- [x] **Langkah 6**: Daftarkan rute `/incomes` di `frontend/src/routes.js` dan tambahkan menu Pemasukan pada seeder `MenuSeeder.php`.
- [x] **Langkah 7**: Jalankan verifikasi build frontend dan uji integrasi end-to-end.

