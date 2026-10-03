# PRD 02: Master Data Refactoring (Kategori, Kelompok Anggaran & Sumber Dana)

**Tanggal:** 2026-10-03  
**Nomor Dokumen:** 2026-10-03-02  
**Status:** PROPOSED FOR IMPLEMENTATION (Tahap 2)  
**Tautan Dokumen Terkait:** [PRD 01 Planning Konsep](2026-10-03-01-planning-perubahan-konsep.md)

---

## 1. Ringkasan Eksekutif

Dokumen ini mendefinisikan spesifikasi teknis pelaksanaan **Tahap 2** dari roadmap Castra: restrukturisasi dan standardisasi **Master Data** sebagai fondasi bagi modul Pemasukan, Pengeluaran, dan Laporan.

Tujuan utama:
1. Menerapkan standarisasi prefix database **`ms_`** untuk seluruh tabel master tanpa merusak data lama.
2. Membangun API dan antarmuka **Master Kategori** (`ms_categories`) dengan pemisahan pos Pemasukan dan Pengeluaran.
3. Membangun API dan antarmuka **Master Kelompok Anggaran** (`ms_budget_groups`) untuk mengelola pembagian alokasi (Need 50%, Fun 30%, Saving 20%, Emergency 0%).
4. Menyelaraskan **Master Sumber Dana** (`ms_income_sources`) dan seluruh UI master ke pola antarmuka baku: **Split Layout** (Tabel Data di Kiri, Form Input/Edit di Kanan).

---

## 2. Rincian Skema Database & Migrasi Baru

Aturan integritas data: **Dilarang mengubah file migrasi lama**. Seluruh perubahan dilakukan melalui berkas migrasi baru.

### 2.1 File Migrasi Baru: `2026_10_03_140000_standardize_master_tables.php`

Tindakan dalam migrasi:
1. **Tabel `ms_budget_groups`**:
   - `id` (bigint unsigned, PK)
   - `user_id` (bigint unsigned, FK ke `users.id` cascade on delete)
   - `code` (varchar 50, contoh: `need`, `fun`, `saving`, `emergency`)
   - `name` (varchar 100)
   - `percentage` (decimal 5,2, default `0.00`)
   - `sort_order` (int, default `0`)
   - `is_system` (boolean, default `false`)
   - `is_active` (boolean, default `true`)
   - `created_at`, `updated_at`
   - Unique Composite: `(user_id, code)`
2. **Rename & Restrukturisasi `categories` $\rightarrow$ `ms_categories`**:
   - Jika tabel `categories` ada, rename menjadi `ms_categories`.
   - Tambahkan kolom:
     - `budget_group_id` (bigint unsigned nullable, FK ke `ms_budget_groups.id` on delete set null)
     - `monthly_estimate` (decimal 15,2, default `0.00`)
     - `is_active` (boolean, default `true`)
   - Unique Composite: `(user_id, type, name)`
3. **Rename `income_sources` $\rightarrow$ `ms_income_sources`**:
   - Jika tabel `income_sources` ada, rename menjadi `ms_income_sources`.

---

## 3. Spesifikasi Backend (Models, Resources, Controllers)

### 3.1 Model Eloquent
1. **`App\Models\IncomeSource`**:
   - `protected $table = 'ms_income_sources';`
   - Fillable: `user_id`, `name`, `description`, `is_active`.
2. **`App\Models\BudgetGroup`**:
   - `protected $table = 'ms_budget_groups';`
   - Fillable: `user_id`, `code`, `name`, `percentage`, `sort_order`, `is_system`, `is_active`.
   - Relasi: `hasMany(Category::class, 'budget_group_id')`.
3. **`App\Models\Category`**:
   - `protected $table = 'ms_categories';`
   - Fillable: `user_id`, `name`, `type`, `budget_group_id`, `monthly_estimate`, `is_active`.
   - Relasi: `belongsTo(BudgetGroup::class, 'budget_group_id')`.

### 3.2 Endpoint API Master

Semua endpoint dilindungi middleware `auth:sanctum` dan di-scope ke `$request->user()`.

#### A. Master Kategori (`/api/categories`)
- **`GET /api/categories`**:
  - Filter params:
    - `type`: `income` atau `expense`
    - `is_active`: `1` atau `0`
    - `search`: string (pencarian nama kategori)
    - `per_page`: default 15
  - Eager load: `budgetGroup`
- **`POST /api/categories`**:
  - Validasi:
    - `name`: required, string, max:100, unique composite per `user_id + type + name`
    - `type`: required, in:`income,expense`
    - `budget_group_id`: required if `type === expense`, nullable if `type === income`, exists in `ms_budget_groups` where `user_id` cocok
    - `monthly_estimate`: numeric, min:0
    - `is_active`: boolean
- **`GET /api/categories/{id}`**: Detail kategori milik user login.
- **`PUT /api/categories/{id}`**: Update kategori dengan validasi unique ignore id sendiri.
- **`DELETE /api/categories/{id}`**: Hapus kategori. Ditolak jika sudah berelasi dengan transaksi.

#### B. Master Kelompok Anggaran (`/api/budget-groups`)
- **`GET /api/budget-groups`**: Daftar kelompok anggaran milik user (diurutkan berdasarkan `sort_order`).
- **`POST /api/budget-groups`**: Tambah kelompok anggaran.
- **`PUT /api/budget-groups/{id}`**: Ubah kelompok anggaran.
- **`DELETE /api/budget-groups/{id}`**: Hapus kelompok anggaran (tolak jika `is_system=true` atau masih dipakai kategori).

---

## 4. Spesifikasi Frontend UI/UX (Split Layout Pattern)

Setiap halaman master menerapkan pola **Split Layout (Tabel Data di Kiri, Form Input di Kanan)**:

```text
┌───────────────────────────────────────┬───────────────────────────────┐
│              KOLOM KIRI               │          KOLOM KANAN          │
│        Grid Tabel Data (col-lg-7)     │     Formulir Input (col-lg-5) │
├───────────────────────────────────────┼───────────────────────────────┤
│ [Pencarian...] [Filter Status: Semua] │ [Judul: Tambah Kategori Baru] │
│ ┌───────────────────────────────────┐ │ Nama: [                    ]  │
│ │ Baris 1: Makan      [Edit] [Hapus]│ │ Pembagian: [ Need (50%) v  ]  │
│ │ Baris 2: Bensin     [Edit] [Hapus]│ │ Estimasi Bulanan: [Rp...   ]  │
│ └───────────────────────────────────┘ │ Status: [x] Aktif             │
│ [Total: 10 data] [Pagination]         │ [ Batal / Reset ] [ Simpan ]  │
└───────────────────────────────────────┴───────────────────────────────┘
```

### 4.1 Master Kategori (`src/views/master/categories/Categories.js`)
- Menggunakan **Tabs**:
  - **Tab 1: Kategori Pengeluaran**
    - Tabel menampilkan: Nama, Pembagian Budget, Estimasi Default, Status, Aksi.
    - Form kanan: Input Nama, Dropdown Pembagian Budget (wajib), Input Estimasi Bulanan, Checkbox Aktif.
  - **Tab 2: Kategori Pemasukan**
    - Tabel menampilkan: Nama, Status, Aksi.
    - Form kanan: Input Nama, Checkbox Aktif (field pembagian disembunyikan/tidak wajib).
- Interaksi:
  - Klik **Edit** pada baris tabel $\rightarrow$ Formulir kanan langsung berubah ke mode edit dengan data baris tersebut.
  - Klik **Batal / Tambah Baru** $\rightarrow$ Formulir kanan direset ke mode tambah baru.
  - Sukses simpan/update/hapus $\rightarrow$ Tampilkan Toast notifikasi dan perbarui tabel secara otomatis.

### 4.2 Penyesuaian Master Sumber Dana (`src/views/master/incomeSources/`)
- Menyesuaikan halaman `IncomeSources.js` yang sudah ada dari modal pop-up menjadi pola **Split Layout** yang sama persis agar konsisten.

---

## 5. Rencana Pengujian (Testing Suite)

1. **Feature Test Backend (`tests/Feature/CategoryTest.php`)**:
   - `test_user_can_create_expense_category_with_budget_group`
   - `test_user_can_create_income_category_without_budget_group`
   - `test_category_name_unique_per_user_and_type`
   - `test_user_only_sees_their_own_categories`
   - `test_filter_by_type_works`
   - `test_user_can_update_category`
   - `test_user_can_delete_category`
2. **Feature Test Penyesuaian `IncomeSourceTest.php`**:
   - Memastikan seluruh 11 unit test `IncomeSourceTest` tetap hijau dengan nama tabel baru `ms_income_sources`.
3. **Frontend Lint & Build Test**:
   - `npm run lint` dan `npm run build` berjalan tanpa error.

---

## 6. Checklist Eksekusi Langkah Kerja

- [x] **Langkah 1**: Buat berkas migrasi `standardize_master_tables.php` dan jalankan `php artisan migrate`.
- [x] **Langkah 2**: Perbarui model `IncomeSource`, buat model `BudgetGroup` dan `Category`.
- [x] **Langkah 3**: Buat `CategoryResource`, `CategoryController`, dan seeder default budget group.
- [x] **Langkah 4**: Buat dan jalankan test PHPUnit `CategoryTest.php` (verifikasi semua pass).
- [x] **Langkah 5**: Bangun UI Frontend Master Kategori (Split Layout) dan refactor Master Sumber Dana ke Split Layout.
- [x] **Langkah 6**: Integrasikan route dan perbarui Swagger OpenAPI.

