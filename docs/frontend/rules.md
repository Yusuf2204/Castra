# Frontend Rules — Aplikasi Pencatatan Keuangan

Aturan menulis kode frontend. Pola yang sudah berjalan di template CoreUI
dianggap standar — ikuti, jangan membuat pola baru yang berbeda.

## Prinsip Umum

- Function components + hooks; gunakan `prop-types` untuk props komponen
  (konsisten dengan template).
- Komponen besar dipecah: `<View>.js`, `<View>Form.js`, `<View>Table.js`
  (pola folder `views/setup/*`) — modul keuangan mengikuti pola yang sama.
- Route di-`lazy` lewat `React.lazy` di `src/routes.js`.
- Error ditampilkan dekat sumbernya (per field); feedback sukses/gagal lewat toast.

## Organisasi Kode

| Lokasi | Isi |
| --- | --- |
| `src/components/` | Komponen reusable (AppHeader, AppSidebar, PrivateRoute, ...) |
| `src/views/<modul>/` | Halaman per modul (dashboard, setup, nanti finance) |
| `src/services/` | Axios instance & helper service (api, toast, sidebar) |
| `src/utils/` | Helper murni (formatters, validators) |
| `src/store.js` | State global Redux |

- **Semua** pemanggilan API lewat `services/api.js` — jangan memakai `axios`
  atau `fetch` langsung di view.
- Formatter uang/tanggal yang dipakai berulang dibuat sebagai helper di
  `src/utils/formatters.js` (belum ada — buat saat modul keuangan mulai).

## State Management

- Store global hanya untuk hal lintas halaman: `user`, `company`, `navigation`,
  `theme`, `sidebarShow`. Pola dispatch memakai action `set` yang sudah ada.
- Data per halaman (list transaksi, kategori, filter) pakai `useState`/`useEffect`
  lokal. Jangan memindahkan data per halaman ke Redux.

## API & Penanganan Error

- Interceptor `services/api.js` sudah menangani: attach token Bearer,
  401 → logout + `/#/login`, 403 → `/#/403`, 404 → `/#/404`, 5xx & network error
  → toast. **Jangan duplikasi redirect ini di view.**
- Error validasi dibaca dari `error.validationErrors`; pesan per field
  ditampilkan dengan `getFieldError(errors, 'field')` (pola di `Login.js`).
- Setiap request asinkron punya state `loading` dan tombol submit di-disable
  saat loading (pola di `Login.js`).
- Baca data response lewat `res.data.data` (envelope backend).

## Format Angka & Tanggal

- Nominal uang selalu diformat:
  `new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })`.
- Kolom nominal di tabel pakai `text-end` + tabular nums agar mudah dibanding.
- Kirim tanggal ke backend dalam format `YYYY-MM-DD`; tampilkan `d MMM yyyy`
  (locale `id-ID`).
- Pemasukan = hijau (`text-success`, tanda `+`), pengeluaran = merah
  (`text-danger`, tanda `−`). Jangan memakai warna lain untuk nominal.

## UI/UX

- Hapus data selalu lewat dialog konfirmasi, lalu toast sukses/gagal (`toastService`).
- Tabel wajib punya empty state; loading pakai `CSpinner`/skeleton.
- Form modal: reset state saat dibuka ulang; validasi tampil per field.
- Sidebar menu bersumber dari `navigation` (Redux) — menu baru didaftarkan di
  backend (tabel `menus`/`role_menus`), bukan di-hardcode di frontend.

## Styling

- SCSS terpusat di `src/scss/`; override lewat variabel CoreUI.
- Hindari inline style kecuali nilai dinamis (mis. warna dari data).
- Prettier: 2 spasi, single quote, tanpa semicolon (sesuai `.prettierrc.js`).

## Keamanan & Performa

- Token di `localStorage` mengikuti pola existing; jangan menyimpan data lain di sana.
- Jangan render HTML dari input user — React sudah escape, jangan pakai
  `dangerouslySetInnerHTML`.
- Route di-lazy untuk menjaga bundle kecil; komponen berat (grafik) di-import dinamis.

## Git & Kualitas

- Commit: conventional commits (`feat:`, `fix:`, ...) — konsisten dengan repo.
- Sebelum commit: `npm run lint` wajib lolos; `npm run build` wajib sukses.
- Jangan commit `node_modules/` dan hasil build.
