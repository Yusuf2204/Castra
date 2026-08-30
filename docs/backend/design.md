# Backend Design — Aplikasi Pencatatan Keuangan

## Prinsip Desain API

- **RESTful & resource-based**: endpoint merepresentasikan resource
  (`users`, `roles`, `menus`, dan nantinya `categories`, `transactions`,
  `monthly-summaries`).
- **Metode HTTP standar**: GET (baca), POST (buat), PUT/PATCH (ubah), DELETE (hapus).
- **Response envelope seragam**: `{ "data", "message", "errors" }` — lihat contoh di bawah.
- **Stateless**: autentikasi Sanctum via header `Authorization: Bearer <token>`.
- **Versi implisit** lewat prefix `/api`; jika perlu versioning eksplisit kelak,
  gunakan `/api/v1`.

## Format Response

Sukses:

```json
{
  "data": { "id": 1, "email": "admin@example.com" },
  "message": "OK",
  "errors": null
}
```

Gagal autentikasi (401):

```json
{
  "data": null,
  "message": "Invalid credentials",
  "errors": { "auth": ["Email or password incorrect"] }
}
```

Gagal validasi (422) — `errors` berisi pesan per field, dipetakan langsung
oleh frontend via `utils/formErrors.js`.

## Autentikasi

- `POST /api/login` mengembalikan `token`, `user`, `company`, dan `navigation`
  (menu sesuai role). Login menghapus token lama user (satu sesi aktif).
- Token ber-ability `cms:access` dengan masa berlaku `SANCTUM_EXPIRATION` (menit).
- Semua endpoint lain berada dalam grup middleware `auth:sanctum`.

## Struktur Route Saat Ini

| Metode | Path | Keterangan |
| --- | --- | --- |
| POST | `/api/login` | Login (public, throttle 5/menit) |
| GET | `/api/company` | Info perusahaan (public) |
| GET | `/api/me` | Data user login + company + navigation |
| POST | `/api/logout` | Hapus token aktif |
| GET | `/api/dashboard-summary` | Statistik dashboard |
| GET/POST/PUT/DELETE | `/api/users` (+`/{id}`) | CRUD user |
| GET/POST/PUT/DELETE | `/api/roles` | CRUD role (tanpa `show`) |
| GET/POST/PUT/DELETE | `/api/menus` | CRUD menu |
| GET | `/api/menus-tree` | Menu bertingkat |
| GET/POST | `/api/role-menus/{role}` | Permission role |
| POST | `/api/change-password` | Ganti password |
| PUT | `/api/company` | Ubah pengaturan perusahaan |

## Rancangan Endpoint Modul Keuangan (proposal)

Endpoint **belum diimplementasikan** — ini rancangan awal, sesuaikan dengan
referensi konsep proyek sebelum menulis kode:

| Metode | Path | Keterangan |
| --- | --- | --- |
| GET/POST | `/api/categories` | List/buat kategori (filter `?type=income\|expense`) |
| PUT/DELETE | `/api/categories/{id}` | Ubah/hapus kategori |
| GET/POST | `/api/transactions` | List/buat transaksi (filter rentang tanggal, kategori, tipe) |
| PUT/DELETE | `/api/transactions/{id}` | Ubah/hapus transaksi |
| GET | `/api/monthly-summaries` | Ringkasan bulan (`?year=&month=`) |
| POST | `/api/monthly-summaries/recalculate` | Hitung ulang ringkasan bulan tertentu |
| GET | `/api/finance-dashboard` | Kartu ringkasan + tren untuk dashboard keuangan |

Semua endpoint di atas berada dalam grup `auth:sanctum` dan datanya
di-scope ke user login.

## Desain Database

### Tabel sistem (existing)

`users` (dengan `role_id`), `roles`, `menus` (hierarki `parent_id`),
`role_menus` (pivot role↔menu), `companies`, `personal_access_tokens`,
plus tabel bawaan Laravel.

### Tabel modul keuangan (migrasi 26 Agustus 2026)

- **`categories`**: `user_id` (FK cascade), `name`, `type` enum `income|expense`.
  Kategori bersifat per user — dua user boleh punya kategori bernama sama.
- **`transactions`**: `user_id` (FK cascade), `category_id` (FK cascade),
  `date`, `description`, `amount` `decimal(15,2)` **bertanda**
  (positif = pemasukan, negatif = pengeluaran). Satu kolom untuk kedua arah —
  arah transaksi mengikuti tipe kategorinya.
- **`monthly_summaries`**: `user_id`, `year`, `month` (1–12), `total_income`,
  `total_expense`, `net`, dengan unique constraint `(user_id, year, month)`.
  Diisi ulang oleh service agregasi — data turunan, bukan sumber kebenaran.

### Keputusan desain yang perlu dipegang

- Selalu simpan jumlah dalam satu kolom bertanda; jangan simpan nilai absolut + tipe.
- Transaksi adalah sumber data; ringkasan bulanan adalah hasil agregasi.
- Semua tabel keuangan membawa `user_id` — tidak ada tabel keuangan global.

## Service Layer

Pola: satu tanggung jawab per class di `app/Services`.
`NavigationService` (menyusun menu per role) adalah contoh existing.
Usulan struktur untuk keuangan:

```text
app/Services/
├── NavigationService.php
└── Finance/
    ├── TransactionService.php      ← create/update + jaga konsistensi ringkasan
    └── MonthlySummaryService.php   ← agregasi & recalculate per bulan
```

## Keamanan

- CORS diatur lewat env (`CORS_ALLOWED_ORIGINS`) — batasi ke domain frontend di production.
- Validasi semua input di controller (pola `$request->validate([...])` existing).
- Throttle pada login; token Sanctum punya masa berlaku dan di-prune oleh scheduler.
- Data antar user terisolasi lewat scope `user_id` — uji ini di PHPUnit.

## Dokumentasi OpenAPI

- Swagger UI: `/api/documentation`; JSON: `/docs?jsonFile=api-docs.json`
  (di-proxy oleh nginx di root stack).
- Setiap endpoint baru wajib memiliki anotasi `@OA\...` di PHPDoc controller,
  lalu jalankan `php artisan l5-swagger:generate`.
