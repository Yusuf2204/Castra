# Castra

Castra adalah aplikasi pencatatan dan perencanaan keuangan pribadi modern berbasis **Laravel 12** dan **React 19**. Aplikasi ini dirancang untuk memberikan visibilitas penuh terhadap arus kas pribadi melalui 4 pilar fungsional: **Master**, **Pemasukan**, **Pengeluaran**, dan **Laporan**.

---

## 4 Pilar Fungsional Keuangan

1. **Master (`ms_`)**:
   - **Sumber Dana (`ms_income_sources`)**: Kelola asal dana masuk (Gaji, Freelance, Bonus, Dividen, dll.) atau rekening/dompet.
   - **Kategori (`ms_categories`)**: Pengelompokan pos transaksi untuk pemasukan (`income`) maupun pengeluaran (`expense`). Kategori pengeluaran dilengkapi dengan estimasi batas anggaran bulanan (`monthly_estimate`).
   - **Alokasi Anggaran (`ms_budget_groups`)**: Amplop alokasi anggaran bulanan (Need, Fun, Saving, Emergency).
2. **Pemasukan (`in_`)**:
   - Pencatatan dan riwayat transaksi dana masuk (`in_transactions`).
   - Tampilan kalender interaktif: klik tanggal untuk membuka form modal input transaksi uang masuk.
   - Agregasi total pemasukan periode bulanan dan navigasi bulan/tahun.
3. **Pengeluaran (`out_`)**:
   - Pencatatan dan riwayat transaksi dana keluar (`out_transactions`) murni diklasifikasikan berdasarkan kategori pos pengeluaran.
   - Monitoring batas anggaran bulanan dengan indikator status (*Aman*, *Mendekati Batas*, *Over Budget*).
   - Tampilan kalender interaktif harian dengan indikator nominal pengeluaran dan opsi beralih ke tabel tabular.
4. **Laporan (`rpt_`)**:
   - **Arus Kas (Cash Flow)**: Rekapitulasi bulanan 12 bulan (Pemasukan, Pengeluaran, Arus Kas Bersih, dan Saldo Kumulatif).
   - **Perbandingan Realisasi Anggaran**: Monitoring persentase serapan belanja terhadap estimasi anggaran per kategori.
   - **Rincian Pengeluaran**: Distribusi pengeluaran per kelompok alokasi (*Need*, *Fun*, *Saving*) dan per pos kategori.

---

## Daftar Endpoint REST API Utama

Seluruh endpoint keuangan dilindungi dengan Bearer token (Laravel Sanctum) dan di-scope ke pengguna yang sedang terautentikasi:

| Modul | Method | Endpoint | Deskripsi |
|---|---|---|---|
| **Autentikasi** | `POST` | `/api/login` | Login & generate token Sanctum |
| | `POST` | `/api/logout` | Revoke token aktif |
| | `GET` | `/api/user` | Profil pengguna aktif |
| **Dashboard** | `GET` | `/api/dashboard-summary` | KPI finansial bulanan, saldo kumulatif & transaksi terkini |
| **Master** | `GET, POST` | `/api/income-sources` | CRUD Sumber Dana |
| | `GET, PUT, DEL`| `/api/income-sources/{id}` | Detail, Update, Hapus Sumber Dana |
| | `GET, POST` | `/api/categories` | CRUD Kategori (filter: type, is_active) |
| | `GET, PUT, DEL`| `/api/categories/{id}` | Detail, Update, Hapus Kategori |
| | `GET, POST` | `/api/budget-groups` | CRUD Kelompok Alokasi Anggaran |
| | `GET, PUT, DEL`| `/api/budget-groups/{id}` | Detail, Update, Hapus Kelompok Anggaran |
| **Pemasukan** | `GET, POST` | `/api/incomes` | CRUD Transaksi Pemasukan (filter: month, search) |
| | `GET, PUT, DEL`| `/api/incomes/{id}` | Detail, Update, Hapus Pemasukan |
| | `GET` | `/api/incomes/calendar` | Ringkasan harian kalender pemasukan per bulan |
| **Pengeluaran** | `GET, POST` | `/api/expenses` | CRUD Transaksi Pengeluaran (filter: month, search) |
| | `GET, PUT, DEL`| `/api/expenses/{id}` | Detail, Update, Hapus Pengeluaran |
| | `GET` | `/api/expenses/calendar` | Ringkasan harian kalender pengeluaran per bulan |
| **Laporan** | `GET` | `/api/reports/cash-flow` | Rekapitulasi arus kas 12 bulan per tahun |
| | `GET` | `/api/reports/budget-comparison` | Evaluasi estimasi vs realisasi per bulan |
| | `GET` | `/api/reports/category-breakdown` | Komposisi pengeluaran per kelompok anggaran |

---

## Fitur Sistem & Fondasi

- **Autentikasi Aman**: Bearer token stateless menggunakan Laravel Sanctum 4.
- **Manajemen Akses**: Pengelolaan Pengguna, Role, dan Menu dinamis berbasis hak akses (*Role Permissions*).
- **Pengaturan Perusahaan/Profil**: Nama instansi/aplikasi, logo, dan favicon dinamis.
- **Pola Desain Antarmuka (SPA UI/UX)**:
  - *Split Layout*: Tabel data di sisi kiri, formulir input/edit di sisi kanan (Master Data).
  - *Calendar & Modal Form*: Khusus transaksi harian Pemasukan dan Pengeluaran.
  - *Full 12-Column Grid*: Row atas untuk filter bar & sub-navigasi, row bawah 12 kolom penuh untuk tabel laporan.
- **Dokumentasi API**: Swagger / OpenAPI 3.0 terintegrasi.
- **Deployment Terisolasi**: Docker Compose multi-container dengan prefix `castra-*`.

---

## Stack Teknologi (Baseline)

| Bagian | Teknologi |
| --- | --- |
| **Backend** | Laravel 12, PHP 8.3+, Laravel Sanctum 4, Eloquent ORM |
| **Frontend** | React 19.2, Vite 7.3, CoreUI 5.5 (React 5.9), Redux 5, React Router 7 |
| **Database** | MySQL 8.0 (Prefix: `ms_`, `in_`, `out_`, `rpt_`) |
| **API Docs** | L5 Swagger / OpenAPI |
| **Testing & Quality** | PHPUnit 11 (57 tests / 220 assertions), Laravel Pint, ESLint 9, Prettier |
| **Deployment** | Docker Compose v2, Nginx Reverse Proxy |

---

## Struktur Proyek

```text
castra/
├── backend/                  Laravel 12 REST API & Swagger
├── frontend/                 React 19 SPA (CoreUI 5)
├── nginx/                    Konfigurasi Nginx reverse proxy
├── docs/                     Dokumentasi teknis & arsitektur
│   ├── prd/                  Dokumen PRD & roadmap perencanaan (Tahap 1 - 6)
│   ├── backend/              Panduan arsitektur & aturan backend
│   └── frontend/             Panduan arsitektur & aturan frontend
├── docker-compose.yml        Orkestrasi container stack Castra
├── .env                      Konfigurasi environment Docker
├── agent.md                  Panduan agen & spesifikasi domain
└── README.md                 Dokumentasi utama proyek
```

---

## Persyaratan Sistem

### Development Lokal
- PHP 8.2 atau 8.3+
- Composer 2.x
- Node.js 20 atau 22+
- npm 10+
- MySQL 8.0+

### Deployment Docker
- Docker Engine 24+
- Docker Compose v2

---

## Deployment Menggunakan Docker

Stack Castra dijalankan melalui Docker Compose dengan 4 layanan utama:

```text
Internet
    │
    ▼
Nginx Reverse Proxy [castra-proxy] (port 80)
    │
    ├── /       ──► Frontend Container [castra-frontend] (port 9002)
    │
    └── /api/*  ──► Backend Container [castra-backend] (port 9001)
                           │
                           ▼
                    Database MySQL [castra-db] (port 3306: internal)
```

### Konfigurasi Environment Docker

Sesuaikan berkas `.env` di root direktori proyek:
```dotenv
APP_NAME=Castra
APP_URL=http://localhost
NGINX_PORT=80
BACKEND_PORT=9001
FRONTEND_PORT=9002

DB_DATABASE=castra
DB_USERNAME=castra
DB_PASSWORD=secret
MYSQL_ROOT_PASSWORD=rootsecret

ADMIN_NAME=Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=adminpassword123
```

### Perintah Docker Compose

```bash
# Build dan jalankan seluruh container
docker compose up -d --build

# Periksa status container
docker compose ps

# Pantau logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx

# Jalankan database seeder
docker exec castra-backend php artisan db:seed

# Hentikan stack
docker compose down
```

### Rincian Service dan Port Docker

| Service | Container Name | Host Port | Internal Port | Keterangan |
| --- | --- | --- | --- | --- |
| **Nginx Reverse Proxy** | `castra-proxy` | `80` | `80` | Entry point utama aplikasi |
| **Backend API** | `castra-backend` | `9001` | `80` | Laravel 12 API |
| **Frontend SPA** | `castra-frontend` | `9002` | `80` | React 19 Nginx Static |
| **Database** | `castra-db` | `127.0.0.1:3306` | `3306` | MySQL 8.0 (loopback host) |

---

## Akses Layanan

| Layanan | Mode Docker | Mode Dev Lokal |
| --- | --- | --- |
| **Aplikasi Utama** | `http://localhost` | `http://localhost:3000` |
| **API Base URL** | `http://localhost/api` | `http://127.0.0.1:8000/api` |
| **Swagger UI** | `http://localhost/api/documentation` | `http://127.0.0.1:8000/api/documentation` |

---

## Pengujian & Kualitas Kode

```bash
# Backend test (PHPUnit)
docker exec castra-backend php artisan test

# Format kode backend (Laravel Pint)
docker exec castra-backend ./vendor/bin/pint

# Frontend lint & build
cd frontend && npm run lint -- --fix && npm run build
docker cp frontend/build/. castra-frontend:/usr/share/nginx/html/
```

---

## Dokumentasi Terkait

- [Perencanaan Perubahan Konsep (PRD 01)](docs/prd/2026-10-03-01-planning-perubahan-konsep.md)
- [PRD Modul Master Data (PRD 02)](docs/prd/2026-10-03-02-prd-restrukturisasi-master-data.md)
- [PRD Modul Pemasukan (PRD 03)](docs/prd/2026-10-03-03-prd-modul-pemasukan.md)
- [PRD Modul Pengeluaran (PRD 04)](docs/prd/2026-10-03-04-prd-modul-pengeluaran.md)
- [PRD Modul Laporan & Dashboard (PRD 05)](docs/prd/2026-10-03-05-prd-modul-laporan-dan-dashboard.md)
- [PRD Finalisasi & Dokumentasi (PRD 06)](docs/prd/2026-10-03-06-prd-finalisasi-navigasi-seeder-dokumentasi.md)
- [Backend Design & Database Schema](docs/backend/design.md)
- [Backend Coding Rules](docs/backend/rules.md)
- [Frontend UI/UX Design](docs/frontend/design.md)
- [Frontend Coding Rules](docs/frontend/rules.md)
- [Prosedur Deployment Production](docs/backend/production-deployment.md)
