# Backend Context — Aplikasi Pencatatan Keuangan

## Ringkasan Proyek

Backend adalah REST API **Laravel 12** (PHP 8.2+) untuk aplikasi **pencatatan keuangan**.
Selain modul keuangan, backend juga menyediakan modul pengelolaan sistem
(users, roles, menu dinamis, dan pengaturan perusahaan) sebagai fondasi aplikasi.

Backend berjalan sebagai bagian dari stack Docker Compose di root proyek:
reverse proxy nginx → backend (PHP-FPM + Nginx + Supervisor) → MySQL 8.

## Teknologi Utama

| Komponen | Teknologi |
| --- | --- |
| Framework | Laravel 12 (PHP 8.2+) |
| Database | MySQL 8 (Eloquent ORM) |
| Autentikasi | Laravel Sanctum 4 (token Bearer, stateless) |
| Dokumentasi API | l5-swagger (OpenAPI) + analyser DocBlock kustom |
| Deployment | Docker Compose (nginx proxy, backend, frontend, db) |
| Kualitas | Laravel Pint (format), PHPUnit (test) |

## Modul

### 1. Modul Sistem (sudah berjalan)

- **Autentikasi**: `POST /api/login`, `GET /api/me`, `POST /api/logout`, `POST /api/change-password`
- **Users & Roles**: CRUD user, role, dan permission (`role_menus`)
- **Menu Dinamis**: menu bertingkat dengan navigasi berdasarkan role
  (`menus-tree` + `App\Services\NavigationService`)
- **Company Settings**: identitas perusahaan (nama, logo, favicon, alamat)
- **Dashboard**: `GET /api/dashboard-summary`

### 2. Modul Pencatatan Keuangan (schema DB sudah ada, API menyusul)

Migrasi tertanggal 26 Agustus 2026 sudah membuat tiga tabel inti:

- **`categories`** — kategori per user dengan tipe `income` atau `expense`
- **`transactions`** — transaksi harian; `amount` bertanda
  (positif = pemasukan, negatif = pengeluaran), terhubung ke kategori
- **`monthly_summaries`** — ringkasan per bulan (`total_income`, `total_expense`, `net`),
  unik per user+bulan

Model, controller, dan route untuk tabel-tabel ini **belum dibuat** — itu
pekerjaan utama berikutnya. Rencana fitur dari referensi konsep proyek:
sumber pendapatan per periode, alokasi anggaran (Need/Fun/Saving/Emergency),
estimasi pengeluaran per kategori, dan dashboard keuangan. Detail rancangan
endpoint dan service ada di `design.md`.

## Arsitektur

- **API-first**: semua interaksi lewat REST API di `routes/api.php`
- **Stateless**: autentikasi Bearer token Sanctum; **satu token aktif per user**
  (token lama dihapus saat login ulang), masa berlaku dari `SANCTUM_EXPIRATION`
  (default 480 menit)
- **Service layer**: business logic di `app/Services` (pola existing: `NavigationService`)
- **Response envelope**: semua response berformat `{ "data", "message", "errors" }`
- **Scope per user**: data keuangan selalu milik user yang login
  (`user_id` + middleware `auth:sanctum`)

## Struktur Direktori Penting

```text
backend/
├── app/
│   ├── Http/Controllers/Api/   ← semua controller API
│   ├── Models/                 ← Company, Menus, RoleMenus, Roles, User
│   ├── OpenApi/Analysers/      ← DocBlockReflectionAnalyser (wajib ada, jangan dihapus)
│   ├── Services/               ← NavigationService (pola untuk service keuangan)
│   └── ...
├── database/migrations/        ← termasuk 3 migrasi modul keuangan
├── routes/api.php              ← satu-satunya file route API
├── config/l5-swagger.php       ← jangan diubah bagian analyser (lihat rules.md)
└── docker-entrypoint.sh        ← generate APP_KEY + auto-seed saat DB kosong
```

## Environment Variables (dari root `.env` via docker-compose)

Daftar lengkap ada di `docker-compose.yml`. Yang paling penting:

```env
APP_NAME=React CMS
APP_ENV=production
APP_KEY=                # dikosongkan saja — entrypoint generate & export sendiri
APP_DEBUG=false
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=db
DB_DATABASE=react_cms
DB_USERNAME=reactcms
DB_PASSWORD=secret

SANCTUM_EXPIRATION=480
CORS_ALLOWED_ORIGINS=   # isi domain frontend di production

ADMIN_NAME=Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=         # minimal 12 karakter
```

## Dokumentasi API (Swagger)

- Swagger UI: `http://localhost/api/documentation` (lewat proxy nginx)
- Langsung ke container backend: `http://localhost:9001/api/documentation`
- Generate ulang: `php artisan l5-swagger:generate`
- Anotasi OpenAPI ditulis sebagai PHPDoc di controller — **baca `rules.md`
  sebelum menyentuh `config/l5-swagger.php`**
