# React CMS Backend

Backend React CMS adalah REST API berbasis Laravel 12. Modul utamanya mencakup
autentikasi Sanctum, users, roles, menu dan permission, company settings,
dashboard summary, serta dokumentasi OpenAPI.

## Persyaratan

- PHP 8.2 atau lebih baru
- Composer 2
- Ekstensi PHP yang dibutuhkan Laravel
- MySQL, MariaDB, atau SQLite

---

## Instalasi Lokal

```bash
composer install
cp .env.example .env
php artisan key:generate
```

Konfigurasikan database di `.env`. Contoh MySQL:

```dotenv
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=react_cms
DB_USERNAME=root
DB_PASSWORD=
```

Untuk membuat akun administrator melalui seeder, isi:

```dotenv
ADMIN_NAME=Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
```

`ADMIN_PASSWORD` harus memiliki minimal 12 karakter. Jalankan migrasi dan seeder:

```bash
php artisan migrate --seed
```

Jika variabel admin belum diisi saat proses seed pertama, isi variabel tersebut
kemudian jalankan:

```bash
php artisan db:seed --class=AdminUserSeeder
```

### Menjalankan API

```bash
php artisan serve
```

Alamat development:

- API: `http://127.0.0.1:8000/api`
- Swagger: `http://127.0.0.1:8000`
- Swagger alternatif: `http://127.0.0.1:8000/api/documentation`

Route `/` sengaja diarahkan ke Swagger UI, bukan halaman welcome Laravel.

---

## Deployment Docker

Backend berjalan dalam container dengan **PHP 8.3 FPM + Nginx + Supervisor**.
Semua konfigurasi diambil dari environment variable yang disuplai oleh
`docker-compose.yml`.

### Struktur File

```text
backend/
├── Dockerfile              # PHP 8.3 FPM + Nginx + Supervisor
├── docker-entrypoint.sh    # Startup: keygen, migrate, swagger, optimize
├── nginx-backend.conf      # Internal nginx untuk Laravel
├── supervisor.conf         # Menjalankan nginx + php-fpm
└── .dockerignore
```

### Build

```bash
# dari root proyek
docker compose build backend
```

### Environment Variables

Semua variabel berikut disuplai dari `docker-compose.yml` (dibaca dari `.env` root):

| Variable | Default | Keterangan |
| --- | --- | --- |
| `APP_KEY` | (auto-generate) | Application key |
| `APP_ENV` | `production` | Environment |
| `APP_DEBUG` | `false` | Debug mode |
| `APP_URL` | `http://localhost` | Base URL aplikasi |
| `DB_HOST` | — | Host database eksternal |
| `DB_PORT` | `3306` | Port database |
| `DB_DATABASE` | — | Nama database |
| `DB_USERNAME` | — | User database |
| `DB_PASSWORD` | — | Password database |
| `ADMIN_PASSWORD` | — | Password admin (min 12 karakter) |
| `SANCTUM_EXPIRATION` | `480` | Masa berlaku token (menit) |
| `CORS_ALLOWED_ORIGINS` | — | Origin yang diizinkan |

### Proses Startup

Saat container pertama kali berjalan, entrypoint akan:

1. Generate `APP_KEY` jika belum diset
2. Menunggu koneksi database siap
3. Menjalankan `php artisan migrate --force`
4. Generate dokumentasi Swagger
5. Optimasi cache (config, route, view)
6. Menjalankan nginx dan php-fpm via Supervisor

### Logs

Log Laravel disimpan di volume `react-cms-logs` dan selamat dari restart container.

```bash
docker compose logs -f backend
```

---

## Dokumentasi Swagger

Generate ulang dokumentasi setelah mengubah annotation OpenAPI:

```bash
php artisan l5-swagger:generate
```

Dokumen JSON dihasilkan di:

```text
storage/api-docs/api-docs.json
```

Alur pengujian endpoint terproteksi:

1. Jalankan `POST /api/login`.
2. Salin token dari response.
3. Klik **Authorize** di Swagger.
4. Masukkan bearer token.
5. Jalankan endpoint terproteksi.

Server OpenAPI dibentuk dari `APP_URL` dengan prefix `/api`, sehingga URL dapat
menyesuaikan environment local, staging, dan production.

## Endpoint Utama

| Modul | Endpoint |
| --- | --- |
| Auth | `POST /login`, `GET /me`, `POST /logout` |
| Dashboard | `GET /dashboard-summary` |
| Users | `GET`, `POST`, `PUT`, `DELETE /users` |
| Password | `POST /change-password` |
| Roles | `GET`, `POST`, `PUT`, `DELETE /roles` |
| Menus | `GET`, `POST`, `PUT`, `DELETE /menus`, `GET /menus-tree` |
| Permissions | `GET`, `POST /role-menus/{role}` |
| Company | `GET /company`, `PUT /company` |

`POST /login` dan `GET /company` bersifat publik. Endpoint lain menggunakan
middleware `auth:sanctum`.

## Respons API

API menggunakan bentuk respons umum:

```json
{
  "data": {},
  "message": "Operation successful",
  "errors": null
}
```

Kesalahan validasi menggunakan `errors` per field:

```json
{
  "data": null,
  "message": "Validation failed",
  "errors": {
    "email": [
      "The email field is required."
    ]
  }
}
```

## Pengujian

```bash
php artisan test
```

Untuk memeriksa daftar route:

```bash
php artisan route:list
```

## CORS dan Sanctum

Origin frontend dikonfigurasi melalui `.env`. Untuk production:

- Batasi origin hanya ke domain frontend.
- Gunakan HTTPS.
- Jangan commit token atau secret.
- Atur masa berlaku dan prefix token sesuai kebijakan sistem.
- Gunakan `APP_DEBUG=false` dan `APP_ENV=production`.

Lihat `.env.production.example` untuk template konfigurasi.

## Deployment

Panduan lengkap mengenai environment, cache, database, scheduler, backup,
logging, dan rollback tersedia di
[docs/production-deployment.md](docs/production-deployment.md).
