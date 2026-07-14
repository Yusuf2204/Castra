# React CMS v1

React CMS adalah aplikasi content management system berbasis Laravel dan React.
Proyek ini menyediakan autentikasi API, pengelolaan pengguna, role dan permission,
menu dinamis, pengaturan perusahaan, dashboard ringkas, serta dokumentasi OpenAPI.

## Fitur Utama

- Autentikasi token menggunakan Laravel Sanctum
- Users dan roles CRUD
- Menu bertingkat dan role-based navigation
- Pengaturan identitas perusahaan, logo, dan favicon
- Dashboard summary
- Respons API yang konsisten
- Dokumentasi Swagger/OpenAPI
- Penanganan error dan validasi terpusat di frontend
- Deployment Docker (reverse proxy, backend, frontend — tiga container terpisah)

## Teknologi

| Bagian | Teknologi |
| --- | --- |
| Backend | Laravel 12, PHP 8.3+, Laravel Sanctum |
| Frontend | React 19, Vite 7, Redux, CoreUI |
| API Docs | L5 Swagger / OpenAPI |
| Database | MySQL, MariaDB, atau SQLite |
| Deployment | Docker, Nginx reverse proxy |

## Struktur Proyek

```text
react-cms/
├── backend/          Laravel REST API dan Swagger
├── frontend/         React CMS application
├── nginx/            Reverse proxy configuration
├── docker-compose.yml
├── .env              Docker environment variables
└── README.md
```

## Persyaratan

### Development Lokal

- PHP 8.2 atau lebih baru
- Composer 2
- Node.js 20 atau lebih baru
- npm
- Database yang didukung Laravel

### Docker Deployment

- Docker Engine 24+
- Docker Compose v2
- Database MySQL/MariaDB yang sudah berjalan (eksternal)

---

## Instalasi Development Lokal

### 1. Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Atur koneksi database dan akun administrator di `.env`:

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=react_cms
DB_USERNAME=root
DB_PASSWORD=

ADMIN_NAME=Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
```

Password admin minimal 12 karakter. Setelah konfigurasi selesai:

```bash
php artisan migrate --seed
php artisan l5-swagger:generate
php artisan serve
```

Backend tersedia di `http://127.0.0.1:8000`.

### 2. Frontend

Buka terminal lain:

```bash
cd frontend
npm ci
npm start
```

Frontend tersedia di `http://localhost:3000`. Vite secara otomatis mem-proxy
request `/api` ke backend di `http://localhost:8000`.

---

## Deployment Docker

Database diasumsikan sudah berjalan sebagai container terpisah dan tidak menjadi
bagian dari stack ini. Contoh: `mysql-container` atau `mariadb-container`.

### Arsitektur

```text
Internet
    │
    ▼
 Nginx Reverse Proxy (port 80)
    │
    ├── /       → Frontend Container (React SPA)
    │
    └── /api/*  → Backend Container (Laravel)
                       │
                       ▼
                 External Database
              (mysql-container:3306)
```

### Konfigurasi

Salin dan sesuaikan `.env` di root proyek:

```bash
nano .env
```

Isi minimal yang harus disesuaikan:

```dotenv
APP_URL=http://your-domain.com
DB_HOST=mysql-container
DB_PORT=3306
DB_DATABASE=react_cms
DB_USERNAME=root
DB_PASSWORD=your-db-password
ADMIN_PASSWORD=your-admin-password
```

### Menjalankan

```bash
# Build dan jalankan semua service
docker compose up -d --build

# Cek status
docker compose ps

# Lihat logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx
```

### Menghentikan

```bash
docker compose down
```

### Restart

```bash
docker compose restart
```

### Update (setelah git pull)

```bash
docker compose down
docker compose up -d --build
```

### Service dan Port

| Service | Container Name | Host Port | Internal |
| --- | --- | --- | --- |
| Nginx Reverse Proxy | `react-cms-proxy` | `80` | — |
| Backend | `react-cms-backend` | `9001` | `80` |
| Frontend | `react-cms-frontend` | `9002` | `80` |

Port backend (`9001`) dan frontend (`9002`) diekspos untuk debugging; di
production cukup gunakan port `80` melalui reverse proxy.

---

## URL Development

| Layanan | URL |
| --- | --- |
| Frontend | `http://localhost:3000` |
| Backend | `http://127.0.0.1:8000` |
| Swagger UI | `http://127.0.0.1:8000` |
| Swagger UI alternatif | `http://127.0.0.1:8000/api/documentation` |
| API base URL | `http://127.0.0.1:8000/api` |

## URL Docker

| Layanan | URL |
| --- | --- |
| Aplikasi | `http://localhost` |
| API | `http://localhost/api` |
| Swagger | `http://localhost/api/documentation` |

Di Swagger, jalankan endpoint login, salin token yang diterima, lalu gunakan
tombol **Authorize** dengan bearer token tersebut untuk menguji endpoint
terproteksi.

---

## Verifikasi

Backend:

```bash
cd backend
php artisan test
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

---

## Dokumentasi

- [Panduan backend](backend/README.md)
- [Panduan frontend](frontend/README.md)
- [Panduan deployment production](backend/docs/production-deployment.md)

---

## Production

Jangan gunakan nilai `.env` development di server production. Gunakan
`backend/.env.production.example` sebagai acuan, nonaktifkan debug, batasi CORS,
gunakan HTTPS, dan simpan secret di luar version control.

Build frontend production dibuat dengan:

```bash
cd frontend
npm ci
npm run build
```

Hasil build berada di `frontend/build`.

Untuk deployment Docker production, gunakan `.env` root dengan `APP_ENV=production`
dan `APP_DEBUG=false`, lalu jalankan `docker compose up -d --build`.
