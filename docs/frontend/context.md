# Frontend Context — Aplikasi Pencatatan Keuangan

## Ringkasan

Frontend adalah single-page application (SPA) untuk **pencatatan keuangan**
berbasis **React 19 + Vite 7 + Redux + CoreUI 5 (free)**. Aplikasi menyediakan
dashboard ringkasan, pengelolaan sistem (users, roles, menu, company), dan —
ke depannya — modul keuangan: transaksi harian, kategori pemasukan/pengeluaran,
dan ringkasan bulanan.

Template dasar berasal dari CoreUI Free React Admin Template yang sudah
disesuaikan dengan kebutuhan proyek (branding dinamis dari `company`,
navigasi berbasis role dari backend, penanganan error terpusat).

## Teknologi

| Komponen | Teknologi |
| --- | --- |
| Framework | React 19.2 |
| Build | Vite 7 (dev server + build) |
| State | Redux 5 + React-Redux 9 (store sederhana di `src/store.js`) |
| UI | CoreUI 5 free (`@coreui/react`, `@coreui/icons-react`) |
| Routing | React Router 7 (**HashRouter**) |
| HTTP | Axios dengan interceptor (`src/services/api.js`) |
| Styling | SCSS (`src/scss/style.scss`) |
| Kualitas | ESLint 9, Prettier |

## Struktur Kode

```text
src/
├── components/          ← komponen bersama (AppHeader, AppSidebar, PrivateRoute, ...)
├── layout/              ← DefaultLayout (sidebar + header + content)
├── views/
│   ├── dashboard/       ← Dashboard.js
│   ├── pages/           ← login, register, 403, 404, 500
│   └── setup/           ← users, roles, menus, rolePermissions, changePassword, company
├── services/
│   ├── api.js           ← axios instance + interceptor auth/error
│   ├── sidebarService.js
│   └── toastService.js
├── utils/formErrors.js  ← normalisasi error validasi per field
├── store.js             ← store Redux global
├── routes.js            ← definisi route (React.lazy)
└── App.js
```

Pola halaman setup selalu sama: `<View>.js` (wadah) + `<View>Form.js` (form modal)
+ `<View>Table.js` (tabel) — modul keuangan wajib mengikuti pola ini.

## State Global (Redux)

```js
{ sidebarShow, theme, user, company, navigation }
```

- `user`, `company`, `navigation` diisi setelah login / `GET /me`.
- `navigation` menentukan menu sidebar (berbasis role, dikirim dari backend).
- State lokal per halaman memakai `useState`/`useEffect` — jangan memindahkan
  semua state ke Redux.

## Alur Autentikasi

1. Login → `POST /api/login` → token disimpan di `localStorage` key `token`,
   lalu `user`, `company`, `navigation` di-dispatch ke store → redirect `/dashboard`.
2. Saat halaman login dibuka dengan token tersimpan, aplikasi mengecek `GET /me`;
   jika valid langsung masuk dashboard, jika tidak token dihapus.
3. Interceptor request menyisipkan `Authorization: Bearer <token>` otomatis.
4. Interceptor response menangani: 401 (non-`/login`) → hapus token → `/#/login`;
   403 → `/#/403`; 404 → `/#/404`; 5xx → toast error; network error → toast.
   **Jangan menambahkan redirect serupa di level view** — sudah terpusat di interceptor.

## Integrasi dengan Backend

- Base URL API: `/api` — saat dev, Vite mem-proxy ke backend lokal; saat Docker,
  nginx reverse proxy di root stack meneruskan `/api/*` ke container backend.
- Format response backend: `{ data, message, errors }` — selalu akses lewat `res.data.data`.
- Error validasi (422) dibaca dari `error.validationErrors` (hasil normalisasi
  `utils/formErrors.js`) dan `error.userMessage` untuk pesan umum.

## Modul Keuangan (rencana)

Halaman yang akan ditambahkan di `src/views/finance/`:

- **Transaksi** — list + filter (rentang tanggal, kategori, tipe), form tambah/ubah, hapus
- **Kategori** — dua tab: Pemasukan & Pengeluaran
- **Ringkasan Bulanan** — pilih bulan/tahun, kartu total & breakdown kategori
- **Dashboard Keuangan** — kartu ringkasan + grafik tren (lihat `design.md`)

## Perintah Umum

```bash
npm ci          # install
npm start       # dev server (vite)
npm run lint    # ESLint
npm run build   # build production
npm run serve   # preview hasil build
```

## Konfigurasi Environment

- Base URL API `src/services/api.js` memakai path relatif `/api` — portabel
  antara dev dan Docker, tidak perlu env khusus.
- Tema light/dark mengikuti pola CoreUI (`useColorModes` di `App.js`).
- Judul dokumen & favicon diatur dinamis dari `company` di Redux (lihat `App.js`).
