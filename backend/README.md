# Castra - Backend API Service

Layanan RESTful API modern untuk **Castra**, platform pencatatan dan perencanaan keuangan pribadi. Dibangun menggunakan **Laravel 12** dan **PHP 8.3+** dengan standar keamanan token **Laravel Sanctum**.

---

## 🏛️ Modul & Kapabilitas API

Layanan API Castra mencakup pilar modul finansial dan tata kelola akun:

### 1. Autentikasi & Profil Pengguna (`/api/`)
- `POST /api/login`: Autentikasi pengguna dan penerbitan token Bearer Sanctum.
- `POST /api/logout`: Pencabutan token aktif.
- `GET /api/user`: Pengambilan data pengguna aktif dan profil perusahaan.
- `PUT /api/profile`: Pembaruan nama, email, dan foto profil pengguna (avatar WebP/Base64).
- `PUT /api/change-password`: Penggantian kata sandi akun dengan validasi sandi saat ini.

### 2. Modul Master Data (`/api/`)
- **Sumber Pemasukan (`/api/income-sources`)**: Pengelolaan sumber dana masuk (gaji, bisnis, bonus, investasi) yang terisolasi per pengguna.
- **Kategori Transaksi (`/api/categories`)**: Pengelompokan pos transaksi untuk pemasukan dan pengeluaran, dilengkapi batas estimasi bulanan.
- **Kelompok Anggaran (`/api/budget-groups`)**: Alokasi pos anggaran (Kebutuhan Pokok, Keinginan, Tabungan, Dana Darurat).
- **Siklus Anggaran (`/api/budget-periods`)**: Siklus anggaran fleksibel berbasis tanggal gajian dengan pembuatan alokasi kategori otomatis (*auto-generated allocation*).

### 3. Modul Transaksi Finansial (`/api/`)
- **Pemasukan (`/api/incomes`)**: Pencatatan transaksi dana masuk, filter bulan/pencarian, dan endpoint ringkasan kalender harian (`/api/incomes/calendar`).
- **Pengeluaran (`/api/expenses`)**: Pencatatan transaksi belanja, monitoring batas anggaran dengan evaluasi status (*Aman*, *Mendekati Batas*, *Over Budget*), serta endpoint kalender harian (`/api/expenses/calendar`).

### 4. Modul Laporan & Dashboard (`/api/`)
- **Dashboard Summary (`/api/dashboard-summary`)**: Ringkasan KPI finansial bulanan, saldo kumulatif, dan transaksi terkini.
- **Arus Kas Tahunan (`/api/reports/cash-flow`)**: Rekapitulasi pergerakan arus kas 12 bulan per tahun.
- **Realisasi Anggaran (`/api/reports/budget-comparison`)**: Evaluasi serapan pengeluaran terhadap alokasi anggaran periode aktif.
- **Rincian Kategori (`/api/reports/category-breakdown`)**: Komposisi pengeluaran per kelompok alokasi anggaran.

### 5. Modul Setup & Administrasi (`/api/`)
- **Pengguna & Peran (`/api/users`, `/api/roles`)**: Manajemen akun pengguna dan tingkatan wewenang (*roles*).
- **Menu & Hak Akses (`/api/menus`, `/api/role-permissions`)**: Manajemen struktur menu aplikasi dan hak akses navigasi dinamis per peran.
- **Profil Perusahaan (`/api/company`)**: Konfigurasi identitas aplikasi, nama perusahaan, logo, dan favicon.

---

## 📂 Struktur Direktori Utama

```text
backend/app/
├── Http/
│   ├── Controllers/
│   │   └── Api/                # Controller REST API seluruh modul
│   │       ├── AuthController.php
│   │       ├── UserController.php
│   │       ├── CategoryController.php
│   │       ├── BudgetGroupController.php
│   │       ├── BudgetPeriodController.php
│   │       ├── IncomeController.php
│   │       ├── ExpenseController.php
│   │       └── ReportController.php
│   ├── Requests/               # Validasi request formulir API
│   └── Resources/              # Transformasi format respon JSON
├── Models/                     # Eloquent ORM Models
├── OpenApi/
│   └── ApiDocumentation.php    # Anotasi Swagger / OpenAPI 3.0
├── Services/                   # Business logic (ReportService, dll.)
└── database/
    ├── migrations/             # Skema tabel database
    └── seeders/                # Seeder data awal & akun admin
```

---

## 📖 Dokumentasi Swagger OpenAPI Interaktif

Dokumentasi RESTful API terintegrasi menggunakan L5-Swagger (OpenAPI 3.0):

- **Alamat URL**: [http://localhost:9001](http://localhost:9001) atau [http://localhost:9001/api/documentation](http://localhost:9001/api/documentation)
- Anda dapat menguji langsung setiap endpoint melalui fitur **"Try it out"** dengan memasukkan Bearer token dari endpoint `/login`.

Untuk memperbarui berkas OpenAPI setelah melakukan perubahan anotasi:
```bash
docker exec castra-backend php artisan l5-swagger:generate
```

---

## 💻 Panduan Instalasi Lokal (Non-Docker)

### Persyaratan:
- **PHP** versi 8.2 atau 8.3+
- **Composer** versi 2.x
- Ekstensi PHP: `pdo_mysql`, `mbstring`, `openssl`, `xml`, `ctype`, `json`, `curl`, `gd`
- Database **MySQL** 8.0+

### Langkah-langkah:
1. **Instal dependensi Composer:**
   ```bash
   composer install
   ```
2. **Salin environment file dan buat app key:**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
3. **Konfigurasikan database pada berkas `.env`:**
   ```dotenv
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=castra
   DB_USERNAME=root
   DB_PASSWORD=
   ```
4. **Jalankan migrasi dan seeder awal:**
   ```bash
   php artisan migrate --seed
   ```
5. **Jalankan server pengembangan:**
   ```bash
   php artisan serve --port=8000
   ```

---

## 🐳 Deployment Menggunakan Docker

Backend berjalan di dalam container Docker yang dioptimasi dengan arsitektur **PHP 8.3 FPM + Nginx + Supervisor**:
- **FastCGI Memory Buffers**: Nginx backend dikonfigurasi dengan alokasi buffer RAM yang memadai (128k/256k) untuk mencegah penulisan file temporer disk pada respon besar seperti aset Swagger.
- **Gzip Compression**: Kompresi otomatis diaktifkan untuk respon JSON dan aset web.
- **Supervisor**: Memastikan service PHP-FPM dan Nginx internal tetap aktif.

```bash
# Build ulang container backend jika ada perubahan konfigurasi
docker compose build backend
docker compose up -d backend
```

---

## 🧪 Pengujian Otomatis & Standar Kualitas

Aplikasi dilengkapi pengujian otomatis (*Unit & Feature Tests*) yang komprehensif menggunakan PHPUnit:

```bash
# Menjalankan seluruh test suite (61 tests)
docker exec castra-backend php artisan test

# Melakukan formatting kode PHP sesuai standar PSR-12 (Laravel Pint)
docker exec castra-backend ./vendor/bin/pint
```
