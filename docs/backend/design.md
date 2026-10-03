# Backend Design - Castra

## 1. Prinsip Desain API & Arsitektur

- **RESTful & Resource-Based**: API dirancang terpisah dan modular mengikuti 4 pilar bisnis: **Master**, **Pemasukan**, **Pengeluaran**, dan **Laporan**.
- **Standar Response Envelope**:
  ```json
  {
    "data": ...,
    "message": "OK",
    "errors": null
  }
  ```
- **Error Handling**: Kesalahan validasi HTTP 422 mengembalikan rincian pesan error per-field pada key `errors`.
- **Stateless & Keamanan**: Seluruh endpoint keuangan dilindungi middleware `auth:sanctum`.
- **Multi-Tenancy User Scope**: Seluruh operasi query dan manipulasi data keuangan di-scope ketat ke pengguna yang sedang login (`$request->user()`).
- **Idempotensi**: Operasi agregasi dan perhitungan ulang summary menghasilkan nilai yang konsisten dan idempoten.

---

## 2. Standar Prefix Tabel Database

Untuk memastikan keterbacaan, keteraturan, dan pemisahan domain yang bersih, penamaan tabel database keuangan wajib menggunakan prefix standar berikut:

| Prefix | Domain | Deskripsi & Contoh Tabel |
| --- | --- | --- |
| **`ms_`** | **Master** | Data referensi dasar aplikasi (`ms_income_sources`, `ms_categories`, `ms_budget_groups`) |
| **`in_`** | **Pemasukan** | Entitas & transaksi dana masuk (`in_transactions`, `in_incomes`) |
| **`out_`** | **Pengeluaran** | Entitas & transaksi dana keluar (`out_transactions`, `out_expenses`) |
| **`rpt_`** | **Laporan / Rekap** | Data ringkasan, agregasi, & reporting (`rpt_monthly_summaries`) |
| *(Tanpa Prefix / Core)* | **Sistem & Admin** | Tabel bawaan framework & otentikasi (`users`, `roles`, `menus`, `role_menus`, `companies`) |

---

## 3. Spesifikasi Skema Database

### 3.1 Domain Master (`ms_`)

#### A. Master Sumber Dana (`ms_income_sources`)
Menyimpan asal atau sumber dana pemasukan (contoh: Gaji, Freelance, Bonus, Dividen).
```sql
CREATE TABLE ms_income_sources (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_ms_income_sources_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_ms_income_sources_user_name (user_id, name)
);
```

#### B. Master Kategori (`ms_categories`)
Menyimpan kategori pengeluaran maupun pemasukan.
```sql
CREATE TABLE ms_categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    budget_group_id BIGINT UNSIGNED NULL,
    monthly_estimate DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_ms_categories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ms_categories_budget_group FOREIGN KEY (budget_group_id) REFERENCES ms_budget_groups(id) ON DELETE SET NULL,
    UNIQUE KEY uk_ms_categories_user_type_name (user_id, type, name)
);
```
*Catatan: Kolom `budget_group_id` wajib diisi jika `type = 'expense'`, dan opsional/null jika `type = 'income'`.*

#### C. Master Kelompok Anggaran (`ms_budget_groups`)
Menyimpan amplop atau pembagian alokasi budget bulanan (Need, Fun, Saving, Emergency).
```sql
CREATE TABLE ms_budget_groups (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    percentage DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    sort_order INT NOT NULL DEFAULT 0,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_ms_budget_groups_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_ms_budget_groups_user_code (user_id, code)
);
```

---

### 3.2 Domain Pemasukan (`in_`)

#### Transaksi Pemasukan (`in_transactions`)
Menyimpan setiap riwayat uang masuk secara mandiri.
```sql
CREATE TABLE in_transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    income_source_id BIGINT UNSIGNED NOT NULL,
    category_id BIGINT UNSIGNED NULL,
    amount DECIMAL(15, 2) NOT NULL,
    transaction_date DATE NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_in_transactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_in_transactions_source FOREIGN KEY (income_source_id) REFERENCES ms_income_sources(id) ON DELETE RESTRICT,
    CONSTRAINT fk_in_transactions_category FOREIGN KEY (category_id) REFERENCES ms_categories(id) ON DELETE SET NULL,
    INDEX idx_in_transactions_user_date (user_id, transaction_date)
);
```
*Aturan: Nilai `amount` selalu bernilai positif.*

---

### 3.3 Domain Pengeluaran (`out_`)

#### Transaksi Pengeluaran (`out_transactions`)
Menyimpan setiap riwayat uang keluar secara mandiri.
```sql
CREATE TABLE out_transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    category_id BIGINT UNSIGNED NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    transaction_date DATE NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_out_transactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_out_transactions_category FOREIGN KEY (category_id) REFERENCES ms_categories(id) ON DELETE RESTRICT,
    INDEX idx_out_transactions_user_date (user_id, transaction_date)
);
```
*Aturan: Nilai input di API selalu angka positif, disimpan sebagai nilai positif di tabel `out_transactions` (karena sudah berada dalam konteks transaksi pengeluaran `out_`).*

---

### 3.4 Domain Laporan & Agregasi (`rpt_`)

#### Ringkasan Bulanan (`rpt_monthly_summaries`)
Menyimpan rekapitulasi performa finansial per bulan/tahun untuk mempercepat query dashboard dan pelaporan.
```sql
CREATE TABLE rpt_monthly_summaries (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    year SMALLINT UNSIGNED NOT NULL,
    month TINYINT UNSIGNED NOT NULL,
    total_income DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    total_expense DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    net_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_rpt_monthly_summaries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_rpt_monthly_summaries_user_period (user_id, year, month)
);
```

---

## 4. Endpoints API

Semua endpoint berada dalam grup middleware `auth:sanctum`.

### 4.1 Master Endpoints (`/api/master/*`)
| Metode | Path | Deskripsi |
| --- | --- | --- |
| GET / POST | `/api/income-sources` | List & Buat Sumber Dana |
| GET / PUT / DELETE | `/api/income-sources/{id}` | Detail, Ubah, Hapus Sumber Dana |
| GET / POST | `/api/categories` | List (filter `type`) & Buat Kategori |
| GET / PUT / DELETE | `/api/categories/{id}` | Detail, Ubah, Hapus Kategori |
| GET / POST | `/api/budget-groups` | List & Buat Kelompok Anggaran |
| GET / PUT / DELETE | `/api/budget-groups/{id}` | Detail, Ubah, Hapus Kelompok Anggaran |

### 4.2 Pemasukan Endpoints (`/api/incomes/*`)
| Metode | Path | Deskripsi |
| --- | --- | --- |
| GET | `/api/incomes` | List riwayat pemasukan (filter periode bulan/tahun, tanggal, sumber dana) |
| POST | `/api/incomes` | Catat pemasukan baru |
| GET | `/api/incomes/{id}` | Detail transaksi pemasukan |
| PUT | `/api/incomes/{id}` | Perbarui transaksi pemasukan |
| DELETE | `/api/incomes/{id}` | Hapus transaksi pemasukan |
| GET | `/api/incomes/calendar` | Agregasi data pemasukan per tanggal untuk tampilan kalender |

### 4.3 Pengeluaran Endpoints (`/api/expenses/*`)
| Metode | Path | Deskripsi |
| --- | --- | --- |
| GET | `/api/expenses` | List riwayat pengeluaran (filter periode, tanggal, kategori) |
| POST | `/api/expenses` | Catat pengeluaran baru |
| GET | `/api/expenses/{id}` | Detail transaksi pengeluaran |
| PUT | `/api/expenses/{id}` | Perbarui transaksi pengeluaran |
| DELETE | `/api/expenses/{id}` | Hapus transaksi pengeluaran |
| GET | `/api/expenses/calendar` | Agregasi data pengeluaran per tanggal untuk tampilan kalender |

### 4.4 Laporan Endpoints (`/api/reports/*`)
| Metode | Path | Deskripsi |
| --- | --- | --- |
| GET | `/api/reports/cash-flow` | Laporan arus kas bulanan (Pemasukan vs Pengeluaran & Net) |
| GET | `/api/reports/category-breakdown` | Rincian pengeluaran per kategori (nominal, persentase, vs budget) |
| GET | `/api/reports/budget-vs-actual` | Evaluasi realisasi belanja terhadap anggaran |
| GET | `/api/reports/trends` | Data tren multi-bulan untuk visualisasi grafik |
| GET | `/api/finance-dashboard` | Ringkasan KPI dashboard utama (saldo, total masuk, total keluar) |

---

## 5. Service Layer

Arsitektur logika bisnis di backend:
```text
app/Services/Finance/
├── Master/
│   ├── IncomeSourceService.php
│   ├── CategoryService.php
│   └── BudgetGroupService.php
├── IncomeService.php
├── ExpenseService.php
└── ReportService.php
```

- **`IncomeService`**: Mengelola transaksi pemasukan, memicu kalkulasi ulang `rpt_monthly_summaries`.
- **`ExpenseService`**: Mengelola transaksi pengeluaran, memvalidasi sisa anggaran kategori, memicu kalkulasi ulang `rpt_monthly_summaries`.
- **`ReportService`**: Menghasilkan data analitik agregat untuk arus kas, breakdown kategori, dan tren.
