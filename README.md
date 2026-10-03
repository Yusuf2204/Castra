# Castra

Castra adalah aplikasi pencatatan dan perencanaan keuangan pribadi modern berbasis **Laravel 12** dan **React 19**. Aplikasi ini dirancang untuk memberikan visibilitas penuh terhadap arus kas pribadi melalui 4 pilar fungsional: **Master**, **Pemasukan**, **Pengeluaran**, dan **Laporan**.

---

## 4 Pilar Fungsional Keuangan

1. **Master (`ms_`)**:
   - **Sumber Dana (`ms_income_sources`)**: Kelola asal dana masuk (Gaji, Freelance, Bonus, Dividen, dll.) atau rekening/dompet.
   - **Kategori (`ms_categories`)**: Pengelompokan pos transaksi untuk pemasukan maupun pengeluaran.
   - **Alokasi Anggaran (`ms_budget_groups`)**: Amplop batas anggaran bulanan (Need, Fun, Saving, Emergency).
2. **Pemasukan (`in_`)**:
   - Pencatatan dan riwayat transaksi dana masuk (`in_transactions`).
   - Tampilan kalender interaktif: klik tanggal untuk membuka form modal input transaksi.
   - Agregasi total pemasukan periode bulanan.
3. **Pengeluaran (`out_`)**:
   - Pencatatan dan riwayat transaksi dana keluar (`out_transactions`).
   - Monitoring limit/budget per kategori pengeluaran dengan indikator status (*Aman*, *Mendekati Batas*, *Over Budget*).
   - Tampilan kalender interaktif harian dan opsi beralih ke tabel tabular.
4. **Laporan (`rpt_`)**:
   - **Arus Kas (Cash Flow)**: Rekapitulasi bulanan Pemasukan vs Pengeluaran & Saldo Bersih (`rpt_monthly_summaries`).
   - **Pengeluaran per Kategori**: Visualisasi grafik donut/batang dan rincian alokasi vs realisasi.
   - **Realisasi Anggaran**: Monitoring serapan anggaran bulanan.
   - **Tren Finansial**: Grafik historis multi-bulan untuk evaluasi tabungan dan belanja.

---

## Fitur Sistem & Fondasi

- **Autentikasi Aman**: Bearer token stateless menggunakan Laravel Sanctum 4.
- **Manajemen Akses**: Pengelolaan Pengguna, Role, dan Menu dinamis berbasis hak akses (*Role Permissions*).
- **Pengaturan Perusahaan/Profil**: Nama instansi/aplikasi, logo, dan favicon dinamis.
- **Pola Desain Antarmuka (SPA UI/UX)**:
  - *Split Layout* (Default Template): Tabel data di sisi kiri, formulir input/edit di sisi kanan.
  - *Calendar & Modal Form*: Khusus transaksi harian Pemasukan dan Pengeluaran.
  - *Full 12-Column Grid*: Row atas untuk filter bar, row bawah 12 kolom penuh untuk tabel laporan.
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
| **Testing & Quality** | PHPUnit 11, Laravel Pint, ESLint 9, Prettier |
| **Deployment** | Docker Compose v2, Nginx Reverse Proxy |

---

## Struktur Proyek

```text
castra/
├── backend/                  Laravel 12 REST API & Swagger
├── frontend/                 React 19 SPA (CoreUI 5)
├── nginx/                    Konfigurasi Nginx reverse proxy
├── docs/                     Dokumentasi teknis & arsitektur
│   ├── prd/                  Dokumen PRD & roadmap perencanaan
│   ├── backend/              Panduan arsitektur & aturan backend
│   └── frontend/             Panduan arsitektur & aturan frontend
├── docker-compose.yml        Orkestrasi container stack Castra
├── .env                      Konfigurasi environment Docker
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

## Panduan Instalasi & Development Lokal

### 1. Backend Setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Atur koneksi database di `backend/.env`:
```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=castra
DB_USERNAME=root
DB_PASSWORD=

ADMIN_NAME=Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
```

Jalankan migrasi, seed, dan server:
```bash
php artisan migrate --seed
php artisan l5-swagger:generate
php artisan serve
```
Backend berjalan di `http://127.0.0.1:8000`.

### 2. Frontend Setup

Buka terminal baru:
```bash
cd frontend
npm ci
npm start
```
Frontend berjalan di `http://localhost:3000` (Vite mem-proxy request `/api` ke port backend `8000`).

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
cd backend && php artisan test

# Format kode backend (Laravel Pint)
cd backend && ./vendor/bin/pint

# Frontend lint & build
cd frontend && npm run lint && npm run build
```

---

## Dokumentasi Terkait

- [Perencanaan Perubahan Konsep (PRD 01)](docs/prd/2026-10-03-01-planning-perubahan-konsep.md)
- [Backend Design & Database Schema](docs/backend/design.md)
- [Backend Coding Rules](docs/backend/rules.md)
- [Frontend UI/UX Design](docs/frontend/design.md)
- [Frontend Coding Rules](docs/frontend/rules.md)
- [Prosedur Deployment Production](docs/backend/production-deployment.md)
