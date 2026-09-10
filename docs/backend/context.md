# Backend Context - Castra

## Ringkasan Proyek

Backend Castra adalah REST API **Laravel 12** (PHP 8.2+) untuk aplikasi
pencatatan dan perencanaan keuangan pribadi berbasis pemasukan gaji.
Castra tidak hanya mencatat pengeluaran, tetapi juga membagi setiap pemasukan
ke budget bulanan dengan prinsip 50% Need, 30% Fun, dan 20% Saving.

Backend berjalan dalam stack Docker Compose:
reverse proxy nginx -> backend (PHP-FPM + Nginx + Supervisor) -> MySQL 8.

## Basis Workbook

Referensi PRD awal: `docs/Keuangan_September_2026.xlsx`.

| Sheet | Peran dalam aplikasi |
| --- | --- |
| `Estimasi` | Master sumber dana, pembagian budget, kategori, estimasi kategori, dan budget per pembagian |
| `Rincian` | Transaksi harian dengan tanggal, kategori, pembagian, budget, nominal, sisa, status, keterangan |
| `Dashboard` | Ringkasan total alokasi, realisasi, sisa alokasi, kondisi per pembagian, estimasi vs realisasi |

Workbook saat ini menghitung pemakaian dari transaksi pengeluaran. Castra harus
menambahkan logic pemasukan: pemasukan menjadi sumber alokasi budget periode,
lalu pengeluaran dibandingkan terhadap alokasi tersebut.

## Teknologi Utama

| Komponen | Teknologi |
| --- | --- |
| Framework | Laravel 12 (PHP 8.2+) |
| Database | MySQL 8 (Eloquent ORM) |
| Autentikasi | Laravel Sanctum 4 (token Bearer, stateless) |
| Dokumentasi API | l5-swagger (OpenAPI) + analyser DocBlock kustom |
| Deployment | Docker Compose |
| Kualitas | Laravel Pint, PHPUnit |

## Modul Saat Ini

### Modul Sistem

- Autentikasi: `POST /api/login`, `GET /api/me`, `POST /api/logout`,
  `POST /api/change-password`
- Users & Roles: CRUD user, role, dan permission (`role_menus`)
- Menu Dinamis: menu bertingkat berdasarkan role (`menus-tree` +
  `App\Services\NavigationService`)
- Company Settings: nama, logo, favicon, alamat
- Dashboard sistem: `GET /api/dashboard-summary`

### Modul Keuangan Existing

Migrasi 26 Agustus 2026 sudah membuat:

- `categories`: kategori per user dengan tipe `income` atau `expense`
- `transactions`: transaksi harian; `amount` bertanda
  (positif = pemasukan, negatif = pengeluaran)
- `monthly_summaries`: ringkasan bulan (`total_income`, `total_expense`, `net`)

Model, controller, route, dan service keuangan belum lengkap. Schema existing
belum cukup untuk master budget dari sheet `Estimasi`; tambahkan migrasi baru
untuk kebutuhan master, jangan menimpa migrasi lama.

## Master Data Yang Dibutuhkan

| Master | Tujuan |
| --- | --- |
| Income Sources | Sumber pemasukan seperti Gaji, Bonus, Freelance |
| Budget Groups | Pembagian budget: Need, Fun, Saving; Emergency sebagai reserve turunan |
| Categories | Kategori pemasukan/pengeluaran. Kategori pengeluaran wajib punya budget group |
| Monthly Plans | Rencana bulan/tahun berisi pemasukan, alokasi, dan estimasi kategori |

Default dari workbook:

- Sumber dana: `Gaji`
- Pembagian: `Need 50%`, `Fun 30%`, `Saving 20%`
- Kategori Need: `Makan`, `Bensin`, `Kuota`, `BPJS`, `Laundry`
- Kategori Fun: `skincare`, `lainnya`, `Jajan`
- Kategori Saving: `Saving`
- Emergency: dihitung dari sisa estimasi, bukan persentase utama baru

## Arsitektur

- API-first: semua interaksi lewat REST API di `routes/api.php`
- Stateless: autentikasi Bearer token Sanctum; satu token aktif per user
- Service layer: business logic di `app/Services`
- Response envelope: semua response `{ "data", "message", "errors" }`
- Scope per user: semua data keuangan memakai `user_id`
- Transaksi aktual tetap menjadi sumber kebenaran; summary dan dashboard
  dihitung dari transaksi + rencana bulanan

## Struktur Direktori Penting

```text
backend/
|-- app/
|   |-- Http/Controllers/Api/
|   |-- Http/Resources/
|   |-- Models/
|   |-- OpenApi/Analysers/
|   `-- Services/
|-- database/migrations/
|-- database/seeders/
|-- routes/api.php
`-- config/l5-swagger.php
```

## Environment Variables Penting

```env
APP_NAME=Castra
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=db
DB_DATABASE=react_cms
DB_USERNAME=reactcms
DB_PASSWORD=secret

SANCTUM_EXPIRATION=480
CORS_ALLOWED_ORIGINS=

ADMIN_NAME=Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=
```

## Dokumentasi API

- Swagger UI: `http://localhost/api/documentation`
- Generate ulang: `php artisan l5-swagger:generate`
- Anotasi OpenAPI ditulis sebagai PHPDoc di controller
- Jangan mengubah analyser kustom di `config/l5-swagger.php`
