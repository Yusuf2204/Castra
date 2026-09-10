# PRD Frontend Master 01 - Income Sources

## Ringkasan

PRD ini mendefinisikan halaman frontend untuk master `Income Sources` atau
`Sumber Dana` pada Castra.

Sumber Dana adalah master asal pemasukan seperti `Gaji`, `Bonus`, `Freelance`,
`THR`, atau `Refund`. Halaman ini dipakai user untuk mengelola daftar sumber
dana sebelum mencatat pemasukan dan menjalankan alokasi 50/30/20.

## Tujuan

- Menyediakan halaman CRUD Sumber Dana di menu `Master`.
- Menggunakan endpoint backend `/api/income-sources` yang sudah dibuat.
- Mengikuti pola CoreUI dan halaman setup existing.
- Menampilkan state loading, empty, validasi field, sukses, gagal, dan konfirmasi hapus.
- Menjaga UX sederhana agar master ini siap dipakai oleh fitur Pemasukan.

## Non-Goal

- Belum membuat halaman Pemasukan.
- Belum membuat alokasi 50/30/20 di frontend.
- Belum membuat dashboard atau rencana bulanan.
- Belum membuat bulk import dari Excel.

## Route dan Menu

Route frontend yang harus ditambahkan:

```text
/master/income-sources
```

File route:

```text
frontend/src/routes.js
```

Tambahkan lazy import:

```js
const IncomeSources = React.lazy(() => import('./views/master/incomeSources/IncomeSources'))
```

Tambahkan route:

```js
{ path: '/master/income-sources', name: 'Sumber Dana', element: IncomeSources }
```

Sidebar menu tetap berasal dari backend `navigation`. Frontend hanya perlu route
agar path dari menu backend bisa dirender.

## API Contract

Base API sudah diatur di `frontend/src/services/api.js` dengan `baseURL: '/api'`.

Endpoint:

| Method | Path | Fungsi |
| --- | --- | --- |
| GET | `/income-sources` | list sumber dana |
| POST | `/income-sources` | buat sumber dana |
| GET | `/income-sources/{id}` | detail, opsional untuk halaman ini |
| PUT/PATCH | `/income-sources/{id}` | update sumber dana |
| DELETE | `/income-sources/{id}` | hapus sumber dana |

Query list:

| Query | Tipe | Keterangan |
| --- | --- | --- |
| `search` | string | cari nama/deskripsi |
| `is_active` | boolean | filter aktif/nonaktif |
| `per_page` | number | jumlah data per halaman |
| `page` | number | halaman pagination Laravel |

Response backend memakai envelope:

```json
{
  "data": {},
  "message": "OK",
  "errors": null
}
```

Catatan penting: backend list memakai Laravel pagination dengan
`IncomeSourceResource::collection($paginator)`. Bentuk JSON biasanya menjadi:

```json
{
  "data": {
    "data": [
      {
        "id": 1,
        "name": "Gaji",
        "description": "Gaji bulanan",
        "is_active": true,
        "created_at": "2026-09-10T10:00:00.000000Z",
        "updated_at": "2026-09-10T10:00:00.000000Z"
      }
    ],
    "links": {},
    "meta": {}
  },
  "message": "OK",
  "errors": null
}
```

Frontend harus membaca list dari `res.data.data.data` bila response paginated.
Buat fallback defensif agar aman jika backend berubah:

```js
const payload = res.data.data
const rows = Array.isArray(payload) ? payload : payload.data || []
const meta = payload.meta || null
```

## Data Shape

Resource item:

```js
{
  id: number,
  name: string,
  description: string | null,
  is_active: boolean,
  created_at: string,
  updated_at: string
}
```

Form payload create:

```js
{
  name: string,
  description?: string | null,
  is_active?: boolean
}
```

Form payload update:

```js
{
  name: string,
  description?: string | null,
  is_active: boolean
}
```

## Struktur File

Buat folder:

```text
frontend/src/views/master/incomeSources/
```

File wajib:

```text
frontend/src/views/master/incomeSources/IncomeSources.js
frontend/src/views/master/incomeSources/IncomeSourcesForm.js
frontend/src/views/master/incomeSources/IncomeSourcesTable.js
```

File yang diubah:

```text
frontend/src/routes.js
```

Opsional bila diperlukan:

```text
frontend/src/utils/formatters.js
```

Untuk PRD ini, helper formatter belum wajib karena halaman hanya menampilkan
teks, status, dan tanggal sederhana.

## Layout Halaman

Ikuti pola halaman setup existing, tetapi gunakan layout yang lebih nyaman
untuk master:

- Kiri atau atas: filter dan tabel.
- Kanan atau bawah: form tambah/edit.
- Desktop: dua kolom `md={8}` untuk tabel dan `md={4}` untuk form.
- Mobile: form dan tabel menumpuk.

Komponen utama:

- Header card: `Sumber Dana`
- Tombol refresh dengan icon `cilReload`
- Filter search
- Filter status: Semua, Aktif, Nonaktif
- Tabel data
- Pagination sederhana
- Form tambah/edit
- Modal konfirmasi delete

## Komponen: `IncomeSources.js`

Tanggung jawab:

- Menyimpan state list, filter, pagination, selected item, loading, saving,
  deleting, dan modal delete.
- Fetch list dari `/income-sources`.
- Mengirim props ke table dan form.
- Menangani create/update/delete.
- Menampilkan toast sukses.

State minimal:

```js
const [incomeSources, setIncomeSources] = useState([])
const [selectedIncomeSource, setSelectedIncomeSource] = useState(null)
const [loading, setLoading] = useState(false)
const [filters, setFilters] = useState({ search: '', is_active: '' })
const [page, setPage] = useState(1)
const [meta, setMeta] = useState(null)
const [confirmOpen, setConfirmOpen] = useState(false)
const [deleteId, setDeleteId] = useState(null)
const [deleting, setDeleting] = useState(false)
```

Fetch:

- `GET /income-sources?search=&is_active=&page=&per_page=10`
- Jangan mengirim `is_active` bila filter status `Semua`.
- Saat filter berubah, reset `page` ke 1.

Delete:

- Buka modal konfirmasi.
- `DELETE /income-sources/{id}`.
- Setelah sukses, toast `Sumber dana dihapus`.
- Refresh list.

## Komponen: `IncomeSourcesForm.js`

Field:

- `name` wajib, max 100.
- `description` opsional, max 1000.
- `is_active` boolean.

UI:

- `CFormInput` untuk nama.
- `CFormTextarea` untuk deskripsi.
- `CFormSwitch` atau `CFormCheck` switch untuk status aktif.
- Tombol submit.
- Tombol reset/batal edit.

Behavior:

- Jika `incomeSource` terpilih, form masuk mode edit.
- Jika tidak ada item terpilih, form mode create.
- Reset form saat item terpilih berubah.
- Gunakan `getFieldError(errors, 'name')`, `description`, `is_active`.
- Disable input dan tombol saat saving.
- Setelah submit sukses:
  - create: kosongkan form
  - update: tetap boleh reset ke create mode lewat `onSaved()`

Validasi dari backend:

- `error.validationErrors` dari interceptor.
- Tampilkan error dekat field.

Label:

- Title create: `Tambah Sumber Dana`
- Title edit: `Edit Sumber Dana`
- Submit create: `Simpan`
- Submit edit: `Update`
- Reset: `Reset`

## Komponen: `IncomeSourcesTable.js`

Props:

```js
{
  incomeSources,
  loading,
  onSelect,
  onDelete
}
```

Kolom:

| Kolom | Isi |
| --- | --- |
| Nama | `name` |
| Deskripsi | `description` atau `-` |
| Status | badge `Aktif` / `Nonaktif` |
| Update Terakhir | tanggal pendek dari `updated_at` |
| Aksi | edit dan delete |

Behavior:

- Loading state dengan `CSpinner`.
- Empty state bila tidak ada data.
- Row click atau tombol edit menjalankan `onSelect(item)`.
- Tombol delete menjalankan `onDelete(item.id)`.
- Jangan redirect manual untuk 401/403/404; interceptor sudah mengurus.

Status badge:

- Aktif: `CBadge color="success"`
- Nonaktif: `CBadge color="secondary"`

## Pagination

Jika backend mengembalikan `meta`, tampilkan pagination sederhana:

- Info: `Menampilkan X dari Y data`
- Tombol Previous dan Next
- Disable previous saat page 1
- Disable next saat `meta.current_page >= meta.last_page`

Tidak perlu pagination kompleks untuk PRD pertama.

## Error Handling

- 422: tampilkan per-field error di form.
- 401, 403, 404, 5xx: mengikuti interceptor `api.js`.
- Delete gagal 422: tampilkan toast error dari `error.userMessage`.
- Network error: sudah ditangani interceptor.

Gunakan service:

```text
frontend/src/services/toastService.js
```

## UX Text

Gunakan label Indonesia karena aplikasi Castra diarahkan untuk workflow lokal:

- Page/card title: `Sumber Dana`
- Search placeholder: `Cari sumber dana...`
- Filter status: `Semua`, `Aktif`, `Nonaktif`
- Empty state: `Belum ada sumber dana.`
- Delete modal title: `Hapus Sumber Dana`
- Delete modal body: `Sumber dana yang dihapus tidak bisa digunakan lagi. Lanjutkan?`
- Toast create: `Sumber dana ditambahkan`
- Toast update: `Sumber dana diperbarui`
- Toast delete: `Sumber dana dihapus`

## Styling

- Gunakan CoreUI components.
- Hindari inline style kecuali kecil dan sudah menjadi pola existing.
- Tabel memakai `responsive`.
- Badge status harus memiliki teks, bukan warna saja.
- Jangan membuat card bersarang.

## Accessibility

- Tombol icon harus memiliki title atau label.
- Input memiliki label.
- Delete harus lewat modal konfirmasi.
- Loading state harus terlihat jelas.

## Acceptance Criteria

- Route `/master/income-sources` bisa dibuka setelah login.
- Halaman mengambil data dari `/api/income-sources`.
- User bisa create sumber dana.
- User bisa update nama, deskripsi, dan status.
- User bisa delete dengan modal konfirmasi.
- Validasi `name` dari backend tampil di field.
- Search bekerja.
- Filter aktif/nonaktif bekerja.
- Pagination next/previous bekerja bila data lebih dari `per_page`.
- Loading dan empty state tampil.
- Sidebar tetap berasal dari backend navigation, tidak di-hardcode.
- `npm run lint` lolos.
- `npm run build` lolos.

## File Konteks Untuk Diberikan Ke LLM

Jika PRD ini diberikan ke LLM lain untuk implementasi frontend, sertakan file berikut.

### Konteks produk dan aturan

```text
agent.md
docs/frontend/context.md
docs/frontend/design.md
docs/frontend/rules.md
docs/frontend/prd/master/01-income-sources.md
docs/backend/prd/master/01-income-sources.md
```

### Pola frontend existing

```text
frontend/src/routes.js
frontend/src/services/api.js
frontend/src/services/toastService.js
frontend/src/utils/formErrors.js
frontend/src/views/setup/roles/Roles.js
frontend/src/views/setup/roles/RolesForm.js
frontend/src/views/setup/roles/RolesTable.js
frontend/src/views/setup/users/Users.js
frontend/src/views/setup/users/UsersForm.js
frontend/src/views/setup/users/UsersTable.js
frontend/src/components/AppSidebar.js
frontend/src/components/AppSidebarNav.js
```

### Backend contract

```text
backend/routes/api.php
backend/app/Http/Controllers/Api/IncomeSourceController.php
backend/app/Http/Resources/IncomeSourceResource.php
backend/storage/api-docs/api-docs.json
```

## Prompt Singkat Untuk LLM Implementasi

Gunakan prompt ini setelah semua file konteks di atas diberikan:

```text
Implementasikan PRD frontend `docs/frontend/prd/master/01-income-sources.md`.
Ikuti pola React/CoreUI existing di Castra. Buat halaman master Sumber Dana
dengan list, filter search/status, pagination sederhana, form create/update,
modal delete, validasi field dari backend, dan route `/master/income-sources`.
Semua request harus lewat `frontend/src/services/api.js`. Jangan hardcode
sidebar menu; backend navigation sudah mengirim menu.
```
