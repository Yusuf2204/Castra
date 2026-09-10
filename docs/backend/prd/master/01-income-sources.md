# PRD Backend Master 01 - Income Sources

## Ringkasan

PRD ini mendefinisikan implementasi backend untuk master pertama Castra:
`Income Sources` atau `Sumber Dana`.

Sumber Dana adalah master asal pemasukan, contoh: `Gaji`, `Bonus`,
`Freelance`, `THR`, atau `Refund`. Master ini menjadi pondasi workflow
pemasukan. Saat user mencatat pemasukan, transaksi income harus bisa menunjuk
sumber dana yang jelas agar alokasi 50/30/20 dapat dilacak per periode.

## Tujuan

- Menyediakan CRUD backend untuk master Sumber Dana per user.
- Menjamin data Sumber Dana terisolasi antar user.
- Menyediakan endpoint yang siap dipakai frontend master.
- Menjadi basis relasi untuk fitur berikutnya: pemasukan, rencana bulanan,
  dan alokasi Need/Fun/Saving.

## Non-Goal

- Belum membuat halaman frontend.
- Belum membuat transaksi pemasukan.
- Belum membuat alokasi 50/30/20.
- Belum membuat `monthly_plans`.
- Belum membuat import dari Excel.

## Konteks Domain

Dalam workbook `docs/Keuangan_September_2026.xlsx`, sheet `Estimasi` memiliki
bagian `Sumber Dana` dengan contoh `Gaji`. Saat ini workbook baru memakai
nilai gaji sebagai angka dasar perhitungan. Di Castra, angka itu harus menjadi
data pemasukan yang berasal dari master Sumber Dana.

## User Story

1. Sebagai user, saya bisa membuat sumber dana bernama `Gaji`.
2. Sebagai user, saya bisa melihat daftar sumber dana milik saya sendiri.
3. Sebagai user, saya bisa mengubah nama, deskripsi, dan status aktif sumber dana.
4. Sebagai user, saya bisa menghapus sumber dana yang belum dipakai.
5. Sebagai user lain, saya tidak bisa melihat atau mengubah sumber dana milik user lain.

## Data Model

### Tabel Baru: `income_sources`

Kolom:

| Kolom | Tipe | Wajib | Catatan |
| --- | --- | --- | --- |
| `id` | bigint unsigned | ya | primary key |
| `user_id` | foreign id | ya | FK ke `users.id`, cascade on delete |
| `name` | string(100) | ya | nama sumber dana |
| `description` | text nullable | tidak | catatan opsional |
| `is_active` | boolean | ya | default `true` |
| `created_at` | timestamp | ya | bawaan Laravel |
| `updated_at` | timestamp | ya | bawaan Laravel |

Index dan constraint:

- Index `user_id`.
- Unique composite: `user_id + name`.
- FK `user_id` cascade on delete.

Catatan:

- Unique name hanya berlaku per user. User A dan User B boleh sama-sama punya
  sumber dana bernama `Gaji`.
- Gunakan migrasi baru. Jangan mengubah migrasi lama.

## Model

Buat model:

```text
backend/app/Models/IncomeSource.php
```

Requirement:

- `$fillable`: `user_id`, `name`, `description`, `is_active`
- casts: `is_active` ke boolean
- relasi:
  - `user()` belongsTo `User`

Tambahkan relasi di `User`:

```php
public function incomeSources()
{
    return $this->hasMany(IncomeSource::class);
}
```

## API Endpoint

Semua endpoint berada dalam middleware `auth:sanctum`.

| Method | Path | Fungsi |
| --- | --- | --- |
| GET | `/api/income-sources` | list sumber dana user login |
| POST | `/api/income-sources` | buat sumber dana |
| GET | `/api/income-sources/{incomeSource}` | detail sumber dana |
| PUT/PATCH | `/api/income-sources/{incomeSource}` | update sumber dana |
| DELETE | `/api/income-sources/{incomeSource}` | hapus sumber dana |

Tambahkan route di:

```text
backend/routes/api.php
```

Contoh:

```php
Route::apiResource('income-sources', IncomeSourceController::class);
```

## Query dan Filter

Endpoint `GET /api/income-sources` mendukung query:

| Query | Tipe | Default | Keterangan |
| --- | --- | --- | --- |
| `search` | string nullable | null | cari di `name` dan `description` |
| `is_active` | boolean nullable | null | filter status aktif |
| `per_page` | integer | 15 | 1 sampai 100 |

Sorting default:

- `name` ascending.

Response list harus paginated agar konsisten untuk master yang akan membesar.

## Validasi

### Store

```php
[
    'name' => ['required', 'string', 'max:100', Rule::unique('income_sources')->where('user_id', $request->user()->id)],
    'description' => ['nullable', 'string', 'max:1000'],
    'is_active' => ['sometimes', 'boolean'],
]
```

Default `is_active`: `true`.

### Update

```php
[
    'name' => ['required', 'string', 'max:100', Rule::unique('income_sources')->where('user_id', $request->user()->id)->ignore($incomeSource->id)],
    'description' => ['nullable', 'string', 'max:1000'],
    'is_active' => ['required', 'boolean'],
]
```

## Authorization dan Scope User

Semua query wajib dibatasi ke user login.

Contoh pola:

```php
$incomeSource = $request->user()
    ->incomeSources()
    ->findOrFail($id);
```

Dilarang memakai `IncomeSource::findOrFail($id)` langsung pada endpoint yang
menerima ID dari user, karena itu membuka risiko akses data user lain.

## Response Contract

Semua response memakai envelope existing:

```json
{
  "data": {},
  "message": "OK",
  "errors": null
}
```

### Resource Shape

Gunakan API Resource:

```text
backend/app/Http/Resources/IncomeSourceResource.php
```

Field:

```json
{
  "id": 1,
  "name": "Gaji",
  "description": "Gaji bulanan",
  "is_active": true,
  "created_at": "2026-09-10T10:00:00.000000Z",
  "updated_at": "2026-09-10T10:00:00.000000Z"
}
```

Jangan expose `user_id` kecuali ada kebutuhan eksplisit.

### Store Success

Status: `201`

```json
{
  "data": {
    "id": 1,
    "name": "Gaji",
    "description": "Gaji bulanan",
    "is_active": true,
    "created_at": "2026-09-10T10:00:00.000000Z",
    "updated_at": "2026-09-10T10:00:00.000000Z"
  },
  "message": "Income source created",
  "errors": null
}
```

### Validation Error

Status: `422`

```json
{
  "data": null,
  "message": "Validation failed",
  "errors": {
    "name": ["The name has already been taken."]
  }
}
```

## Delete Rule

Untuk master pertama, hard delete boleh dilakukan selama belum ada tabel yang
mereferensikan `income_sources`.

Namun controller harus siap untuk aturan berikutnya:

- Jika nanti `transactions` atau `monthly_plan_incomes` sudah punya
  `income_source_id`, delete sumber dana yang sudah dipakai harus ditolak
  dengan status `422`.
- Alternatif UX: user menonaktifkan sumber dana lewat `is_active = false`.

Untuk PRD ini, cukup implement delete normal dengan scope user.

## Controller

Buat controller:

```text
backend/app/Http/Controllers/Api/IncomeSourceController.php
```

Method:

- `index(Request $request)`
- `store(Request $request)`
- `show(Request $request, $id)`
- `update(Request $request, $id)`
- `destroy(Request $request, $id)`

Controller harus:

- Menggunakan `$request->validate(...)`.
- Menggunakan query dari `$request->user()->incomeSources()`.
- Mengembalikan envelope response.
- Menggunakan `IncomeSourceResource`.
- Memiliki anotasi OpenAPI PHPDoc untuk semua endpoint.

## OpenAPI

Tambahkan anotasi `@OA` di `IncomeSourceController`.

Minimal dokumentasikan:

- auth Bearer token
- query param `search`, `is_active`, `per_page`
- request body store/update
- response 200, 201, 401, 404, 422

Setelah implementasi:

```bash
cd backend
php artisan l5-swagger:generate
```

Jangan mengubah `config/l5-swagger.php` bagian analyser.

## Menu Backend

Master ini membutuhkan menu agar nantinya tampil di frontend.

Update `MenuSeeder` secara idempoten:

- Parent: `Master`, path `/master`, icon `cilSettings` atau ikon CoreUI terdekat
- Child: `Sumber Dana`, path `/master/income-sources`, order awal di group Master

Update `RoleMenuSeeder`:

- Admin mendapat semua menu.
- User minimal dapat menu Dashboard dan menu yang memang diizinkan sesuai
  keputusan produk. Untuk PRD backend ini, cukup pastikan admin mendapat
  menu baru tanpa duplikasi.

Catatan: Jika menu belum dipakai sampai frontend dibuat, endpoint API tetap
harus selesai lebih dulu.

## File Yang Dibuat

Wajib:

```text
backend/database/migrations/YYYY_MM_DD_HHMMSS_create_income_sources_table.php
backend/app/Models/IncomeSource.php
backend/app/Http/Controllers/Api/IncomeSourceController.php
backend/app/Http/Resources/IncomeSourceResource.php
```

Opsional tapi disarankan bila memakai test:

```text
backend/database/factories/IncomeSourceFactory.php
backend/tests/Feature/IncomeSourceTest.php
```

## File Yang Diubah

Wajib:

```text
backend/routes/api.php
backend/app/Models/User.php
backend/database/seeders/MenuSeeder.php
backend/database/seeders/RoleMenuSeeder.php
```

Kemungkinan berubah otomatis setelah generate Swagger:

```text
backend/storage/api-docs/api-docs.json
```

## Test Plan

Buat feature test untuk:

1. User login bisa membuat sumber dana.
2. Nama sumber dana wajib.
3. Nama sumber dana unik per user.
4. User lain boleh punya nama sumber dana yang sama.
5. User hanya melihat sumber dana miliknya.
6. User tidak bisa melihat detail sumber dana milik user lain.
7. User bisa update sumber dana miliknya.
8. User bisa delete sumber dana miliknya.
9. Filter `search` bekerja.
10. Filter `is_active` bekerja.

Command:

```bash
cd backend
php artisan test --filter=IncomeSourceTest
```

## Acceptance Criteria

- Migration berhasil dijalankan.
- Endpoint CRUD `/api/income-sources` tersedia di `auth:sanctum`.
- Semua response mengikuti envelope `{ data, message, errors }`.
- Data selalu scoped ke user login.
- `user_id + name` unik.
- `is_active` default `true`.
- List endpoint paginated dan mendukung filter.
- OpenAPI berhasil digenerate.
- Test fitur income source lulus.

## File Konteks Untuk Diberikan Ke LLM

Jika PRD ini diberikan ke LLM lain untuk implementasi, sertakan file berikut.

### Konteks produk dan aturan

```text
agent.md
docs/backend/context.md
docs/backend/design.md
docs/backend/rules.md
docs/backend/prd/master/01-income-sources.md
```

### Pola backend existing

```text
backend/routes/api.php
backend/app/Http/Controllers/Api/MenuController.php
backend/app/Http/Controllers/Api/RoleController.php
backend/app/Http/Controllers/Api/UserController.php
backend/app/Models/User.php
backend/app/Models/Menus.php
backend/app/Models/Roles.php
backend/app/Models/RoleMenus.php
backend/app/Services/NavigationService.php
```

### Database dan seeder existing

```text
backend/database/migrations/0001_01_01_000000_create_users_table.php
backend/database/migrations/2026_02_10_081627_create_menus_table.php
backend/database/migrations/2026_02_10_081758_create_rolemenus_table.php
backend/database/migrations/2026_08_26_114708_create_categories_table.php
backend/database/migrations/2026_08_26_114711_create_transactions_table.php
backend/database/migrations/2026_08_26_114714_create_monthly_summaries_table.php
backend/database/seeders/MenuSeeder.php
backend/database/seeders/RoleMenuSeeder.php
backend/database/seeders/DatabaseSeeder.php
```

### Swagger dan test

```text
backend/config/l5-swagger.php
backend/app/OpenApi/Analysers/DocBlockReflectionAnalyser.php
backend/phpunit.xml
backend/tests/TestCase.php
```

## Prompt Singkat Untuk LLM Implementasi

Gunakan prompt ini setelah semua file konteks di atas diberikan:

```text
Implementasikan PRD backend `docs/backend/prd/master/01-income-sources.md`.
Ikuti pola Laravel existing di repo Castra. Jangan mengubah migrasi lama.
Buat migration, model, resource, controller, route, seeder menu/role menu jika
diperlukan, anotasi OpenAPI, dan feature test. Semua endpoint harus memakai
auth:sanctum, response envelope existing, dan scope data per user.
```
