# Backend Rules — Aplikasi Pencatatan Keuangan

Aturan yang wajib diikuti saat menulis kode backend. Sebagian besar berasal
dari pola yang sudah berjalan; sisanya dari bug yang pernah memecahkan stack —
**jangan memunculkan bug itu lagi**.

## Struktur & Penamaan

- Semua controller API ada di `app/Http/Controllers/Api/`, nama berakhiran `Controller`.
- Controller dibuat tipis: validasi input di method controller, logika bisnis
  dipindah ke service di `app/Services/` (lihat pola `NavigationService`).
- Model Eloquent di `app/Models/` (bukan folder lain), gunakan relasi yang eksplisit.
- Migrasi: ikuti penamaan tanggal yang sudah ada (`YYYY_MM_DD_HHMMSS_...`),
  jangan menimpa file migrasi lama — selalu tambah file baru.
- Transformasi response memakai **API Resource** di `app/Http/Resources/`
  (folder belum ada — buat saat diperlukan).

## Aturan API

- **Semua** response memakai envelope yang sama, tidak ada format lain:

  ```json
  { "data": { ... }, "message": "OK", "errors": null }
  ```

  Error validasi (422) berisi pesan per field di `errors` — dipetakan langsung
  oleh frontend via `utils/formErrors.js`.
- Route baru ditambahkan di `routes/api.php` dalam grup `auth:sanctum`
  (kecuali endpoint publik seperti `login` dan `company`).
- **Scope data keuangan per user — mutlak.** Selalu query lewat user yang login,
  contoh `$request->user()->transactions()`. Dilarang mengembalikan data milik user lain.
- Jumlah uang memakai `decimal(15,2)` **bertanda** sesuai konvensi tabel
  `transactions`: pemasukan positif, pengeluaran negatif. Jangan memakai dua kolom terpisah.
- Tanggal dikirim/diterima dalam format `Y-m-d` (kolom `date`), konsisten di semua endpoint.
- Endpoint baru wajib memiliki anotasi OpenAPI (lihat bagian Swagger di bawah).

## Autentikasi & Keamanan

- Tetap pakai pola Sanctum di `AuthController`: satu token aktif per user —
  hapus token lama (`$user->tokens()->delete()`) saat login, beri ability
  `cms:access` dan masa berlaku dari config `sanctum.expiration`.
- Rate limit di endpoint login (`throttle:5,1`) dipertahankan.
- Password admin minimal 12 karakter (dari `ADMIN_PASSWORD` di root `.env`).
- Jangan pernah commit `.env` atau secret apa pun.
- Jangan menulis token, password, atau data sensitif ke log.

## Swagger / OpenAPI

- Anotasi OpenAPI ditulis sebagai **PHPDoc** (`@OA\...`) di controller —
  itulah alasan analyser kustom ada.
- **Jangan menyentuh bagian `analyser` di `config/l5-swagger.php`.**
  Config bawaan membuat `php artisan config:cache` gagal (tidak serializable),
  dan mengosongkan analyser (`null`) membuat anotasi DocBlock hilang diam-diam.
  Solusi yang sudah ada: `App\OpenApi\Analysers\DocBlockReflectionAnalyser`.
  Jika `config:cache` atau `l5-swagger:generate` error, periksa class ini dulu.
- Generate ulang dokumentasi setelah menambah endpoint:
  `php artisan l5-swagger:generate`.

## Gotchas Docker (jangan regresi)

1. `docker-compose.yml` mengoper `APP_KEY: "${APP_KEY:-}"` sebagai **string kosong**
   yang menimpa `.env` karena dotenv Laravel immutable. `docker-entrypoint.sh`
   sudah menangani ini dengan meng-export key hasil generate — **jangan hapus
   logika itu**, dan biarkan `APP_KEY` kosong di root `.env`.
2. Seeder harus **idempoten**: gunakan `firstOrCreate` atau guard `exists`
   (lihat `MenuSeeder`, `CompanySeeder`). Entrypoint menjalankan seed otomatis
   hanya saat tabel `users` kosong — jangan ubah perilaku ini.

## Kualitas Kode

- Format dengan Laravel Pint sebelum commit.
- Test dengan PHPUnit di `tests/` — minimal: relasi model, endpoint autentikasi,
  dan **scope user** pada endpoint keuangan.
- Endpoint list memakai paginasi yang konsisten.
- Nama kolom, method, dan route memakai bahasa Inggris (konsisten dengan kode
  existing), meskipun dokumentasi berbahasa Indonesia.
