# PRD 04: Modul Pengeluaran (Expenses) & Antarmuka Kalender Pengeluaran

**Tanggal:** 2026-10-03  
**Nomor Dokumen:** 2026-10-03-04  
**Status:** SELESAI (COMPLETED)  
**Tautan Dokumen Terkait:**  
- [PRD 01 Planning Perubahan Konsep](2026-10-03-01-planning-perubahan-konsep.md)  
- [PRD 02 Master Data Refactoring](2026-10-03-02-prd-master-kategori-dan-budget-groups.md)  
- [PRD 03 Modul Pemasukan](2026-10-03-03-prd-modul-pemasukan.md)  
- [Backend Design Guide](../backend/design.md)  
- [Frontend Design Guide](../frontend/design.md)  

---

## 1. Ringkasan Eksekutif

Dokumen ini mendefinisikan spesifikasi teknis pelaksanaan **Tahap 4** dari roadmap Castra: pembangunan modul **Pengeluaran (Expenses)**. Modul ini merupakan pilar ketiga dari 4 pilar arsitektur aplikasi (Master, Pemasukan, Pengeluaran, Laporan).

Tujuan utama:
1. Menerapkan skema database ber-prefix **`out_`** dengan tabel `out_transactions` untuk mencatat seluruh arus kas keluar.
2. Memastikan relasi pengeluaran murni terhubung ke **Master Kategori Pengeluaran** (`ms_categories` type `expense`), tanpa mengaitkan sumber dana pemasukan.
3. Membangun API Backend (`/api/expenses`) lengkap dengan endpoint data transaksi dan endpoint agregasi harian kalender (`/api/expenses/calendar`).
4. Membangun antarmuka frontend **Pola 2: Menu Khusus Transaksi (Monthly Calendar Grid + Modal Input Harian)** dengan tema visual pengeluaran (aksen merah/danger) dan opsi toggle ke **Tampilan Tabel List**.
5. Menyediakan pengujian otomatis backend (PHPUnit) dan frontend (ESLint & Vite build).

---

## 2. Rincian Skema Database & Migrasi Baru

Aturan integritas data: **Dilarang memodifikasi migrasi lama**. Seluruh perubahan dilakukan melalui berkas migrasi baru.

### 2.1 File Migrasi Baru: `2026_10_03_160000_create_out_transactions_table.php`

Struktur tabel `out_transactions`:
- `id` (bigint unsigned, primary key, auto increment)
- `user_id` (bigint unsigned, foreign key ke `users.id`, onDelete cascade)
- `category_id` (bigint unsigned, foreign key ke `ms_categories.id`, onDelete restrict)
- `transaction_date` (date, indexed)
- `amount` (decimal 15,2, unsigned / nilai pengeluaran selalu positif)
- `notes` (text nullable / catatan pengeluaran)
- `created_at`, `updated_at` (timestamps)

Indeks optimasi:
- `index(['user_id', 'transaction_date'])` untuk query kalender bulanan dan rekapitulasi.
- `index(['user_id', 'category_id'])` untuk analisis pengeluaran per kategori.

---

## 3. Spesifikasi Backend (Models, Resources, Controllers)

### 3.1 Model Eloquent: `App\Models\ExpenseTransaction`
- Tabel: `protected $table = 'out_transactions';`
- Fillable: `['user_id', 'category_id', 'transaction_date', 'amount', 'notes']`
- Casts:
  - `transaction_date` $\rightarrow$ `date:Y-m-d`
  - `amount` $\rightarrow$ `float`
- Relasi:
  - `user()` $\rightarrow$ `belongsTo(User::class)`
  - `category()` $\rightarrow$ `belongsTo(Category::class, 'category_id')`

### 3.2 Resource: `App\Http\Resources\ExpenseTransactionResource`
Format JSON:
```json
{
  "id": 1,
  "user_id": 1,
  "transaction_date": "2026-10-02",
  "amount": 75000.0,
  "notes": "Makan siang di warteg",
  "category_id": 3,
  "category": {
    "id": 3,
    "name": "Makan & Minum",
    "type": "expense",
    "monthly_estimate": 2000000.0,
    "budget_group": {
      "id": 1,
      "name": "Kebutuhan Pokok",
      "code": "need",
      "percentage": 50.0
    }
  },
  "created_at": "2026-10-02T12:30:00.000000Z",
  "updated_at": "2026-10-02T12:30:00.000000Z"
}
```

### 3.3 Endpoints API: `App\Http\Controllers\Api\ExpenseController`

Semua endpoint dilindungi oleh middleware `auth:sanctum` dan di-scope ke `$request->user()`.

1. **`GET /api/expenses`**:
   - Query params:
     - `month`: format `YYYY-MM` (opsional)
     - `start_date`: format `YYYY-MM-DD` (opsional)
     - `end_date`: format `YYYY-MM-DD` (opsional)
     - `category_id`: bigint (opsional)
     - `budget_group_id`: bigint (opsional)
     - `search`: string (mencari dalam `notes` dan nama kategori)
     - `page`: default 1
     - `per_page`: default 15
   - Return: paginated data dengan eager loading `category.budgetGroup`.

2. **`GET /api/expenses/calendar`**:
   - Query params:
     - `month`: required, format `YYYY-MM` (contoh: `2026-10`)
     - `category_id`: opsional
     - `budget_group_id`: opsional
   - Response:
     - Ringkasan akumulasi harian untuk kalender pengeluaran:
     ```json
     {
       "data": {
         "month": "2026-10",
         "total_month": 3250000.0,
         "transaction_count": 18,
         "days": {
           "2026-10-02": {
             "total": 75000.0,
             "count": 1,
             "items": [...]
           }
         }
       },
       "message": "OK"
     }
     ```

3. **`POST /api/expenses`**:
   - Payload:
     - `transaction_date`: required, date_format `Y-m-d`
     - `amount`: required, numeric, min:0.01
     - `category_id`: required, exists:ms_categories,id (milik user login dan type `expense`)
     - `notes`: nullable, string, max:500
   - Return: 201 Created + single resource.

4. **`GET /api/expenses/{id}`**: Detail transaksi milik user login.
5. **`PUT /api/expenses/{id}`**: Update transaksi milik user login.
6. **`DELETE /api/expenses/{id}`**: Hapus transaksi milik user login.

---

## 4. Desain Antarmuka Pengguna Frontend (Pola 2: Transaksi Kalender)

Direktori: `frontend/src/views/expenses/`
- `Expenses.js` (Halaman utama container & switcher kalender/tabel)
- `ExpenseCalendar.js` (Grid Kalender Bulanan interaktif dengan visual aksen merah)
- `ExpensesTable.js` (Tampilan Tabel List pengeluaran dengan filter & pagination)
- `ExpenseModal.js` (Modal Form Input / Edit / Riwayat Transaksi Pengeluaran per hari)

### 4.1 Logika & Alur Kalender Interaktif
1. **Header Kalender**:
   - Navigasi bulan (`<`, nama bulan/tahun, `>`, `Bulan Ini`).
   - Banner ringkasan: Total Pengeluaran Bulan Ini (format Rupiah tebal, warna merah/danger, jumlah transaksi).
   - Tombol Switcher Tampilan: **Kalender** vs **Tabel List**.
   - Tombol **+ Tambah Pengeluaran**: Membuka modal form pengeluaran dengan default tanggal hari ini.
2. **Grid Kalender (7 Kolom)**:
   - Kotak tanggal yang memiliki transaksi pengeluaran di-highlight dengan latar merah lembut (`bg-danger-subtle`).
   - Badge nominal pengeluaran: contoh `- Rp 75.000` dan jumlah transaksi.
   - Klik kotak tanggal membuka **`ExpenseModal`** untuk tanggal tersebut.
3. **Modal Input & Riwayat Transaksi Hari Tersebut (`ExpenseModal.js`)**:
   - Riwayat transaksi pengeluaran hari tersebut di tabel atas (Kategori, Kelompok Anggaran, Nominal, Catatan, tombol Edit & Hapus).
   - Formulir input di bawah:
     - Tanggal Transaksi.
     - Dropdown Kategori Pengeluaran (`ms_categories` type `expense` dengan info kelompok anggaran).
     - Input Nominal (Rp).
     - Input Catatan.
     - Tombol Simpan Pengeluaran (warna danger/merah).

---

## 5. Rencana Pengujian (Testing Suite)

1. **Feature Test Backend (`tests/Feature/ExpenseTransactionTest.php`)**:
   - `test_authenticated_user_can_create_expense_transaction`
   - `test_expense_requires_valid_expense_category_and_positive_amount`
   - `test_user_cannot_use_income_category_for_expense`
   - `test_user_cannot_use_another_users_category`
   - `test_user_only_sees_their_own_expenses`
   - `test_expense_filtering_by_month_category_and_search`
   - `test_calendar_endpoint_returns_aggregated_daily_totals_for_given_month`
   - `test_user_can_update_their_own_expense_transaction`
   - `test_user_can_delete_their_own_expense_transaction`
   - `test_user_cannot_access_or_modify_other_users_expense`
2. **Frontend Lint & Build**:
   - `npm run lint` lolos tanpa error.
   - `npm run build` berhasil membangun bundel produksi.

---

## 6. Checklist Eksekusi Langkah Kerja

- [x] **Langkah 1**: Buat berkas migrasi `2026_10_03_160000_create_out_transactions_table.php` dan jalankan `php artisan migrate`.
- [x] **Langkah 2**: Buat model `ExpenseTransaction`, factory `ExpenseTransactionFactory`, dan resource `ExpenseTransactionResource`.
- [x] **Langkah 3**: Buat `ExpenseController` dengan method `index`, `calendar`, `store`, `show`, `update`, `destroy` dan daftarkan route di `routes/api.php`.
- [x] **Langkah 4**: Buat dan jalankan test PHPUnit `ExpenseTransactionTest.php` hingga seluruh test berstatus hijau.
- [x] **Langkah 5**: Bangun komponen Frontend Modul Pengeluaran (`Expenses.js`, `ExpenseCalendar.js`, `ExpensesTable.js`, `ExpenseModal.js`).
- [x] **Langkah 6**: Daftarkan rute `/expenses` di `frontend/src/routes.js` dan tambahkan menu Pengeluaran pada seeder `MenuSeeder.php` serta `RoleMenuSeeder.php`.
- [x] **Langkah 7**: Jalankan verifikasi build frontend dan pastikan seluruh test suite backend tetap hijau.

