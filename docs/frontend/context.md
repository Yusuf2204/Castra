# Frontend Context - Castra

## Ringkasan

Frontend Castra adalah SPA **React 19 + Vite 7 + Redux + CoreUI 5 (free)**
untuk pencatatan dan perencanaan keuangan pribadi berbasis pemasukan gaji.
Alur utama aplikasi: catat pemasukan, alokasikan ke Need/Fun/Saving, susun
rencana kategori bulanan, lalu pantau realisasi harian dan sisa budget.

Template dasar berasal dari CoreUI Free React Admin Template dan sudah memiliki
branding dinamis, navigasi berbasis role, auth Sanctum, dan error handling
terpusat.

## Basis Workbook

Referensi awal: `docs/Keuangan_September_2026.xlsx`.

| Sheet | Padanan UI |
| --- | --- |
| `Estimasi` | Halaman Master + Rencana Bulanan |
| `Rincian` | Halaman Rincian Transaksi |
| `Dashboard` | Dashboard Keuangan |

Masalah utama workbook: pengeluaran sudah dihitung, tetapi pemasukan belum
menjadi alur eksplisit. Di Castra, pemasukan harus menjadi langkah pertama yang
menghasilkan alokasi budget.

## Teknologi

| Komponen | Teknologi |
| --- | --- |
| Framework | React 19.2 |
| Build | Vite 7 |
| State | Redux 5 + React-Redux 9 |
| UI | CoreUI 5 free |
| Routing | React Router 7 dengan HashRouter |
| HTTP | Axios instance di `src/services/api.js` |
| Styling | SCSS |
| Kualitas | ESLint 9, Prettier |

## Struktur Kode

```text
src/
|-- components/
|-- layout/
|-- views/
|   |-- dashboard/
|   |-- finance/
|   |   |-- incomes/
|   |   |-- transactions/
|   |   |-- monthlyPlans/
|   |   `-- monthlySummaries/
|   |-- master/
|   |   |-- incomeSources/
|   |   |-- budgetGroups/
|   |   `-- categories/
|   |-- pages/
|   `-- setup/
|-- services/
|-- utils/
|-- store.js
|-- routes.js
`-- App.js
```

Pola halaman tetap mengikuti setup existing: `<View>.js`, `<View>Form.js`,
`<View>Table.js`.

## State Global

```js
{ sidebarShow, theme, user, company, navigation }
```

Data transaksi, master, filter, dan rencana bulanan tetap state lokal halaman.
Redux hanya untuk state lintas halaman.

## Menu Aplikasi

Sidebar berasal dari `navigation` backend, bukan hardcode frontend.

Menu target:

- Dashboard
- Keuangan
  - Pemasukan
  - Rincian Transaksi
  - Rencana Bulanan
  - Ringkasan Bulanan
- Master
  - Sumber Dana
  - Pembagian Budget
  - Kategori
- Setup
  - Company, Users, Roles, Menus, Role Permissions, Change Password

## Alur UX Utama

1. User membuka periode bulan/tahun.
2. User mencatat pemasukan dari sumber dana.
3. Sistem menampilkan hasil alokasi Need/Fun/Saving.
4. User menyusun atau meninjau estimasi kategori di Rencana Bulanan.
5. User mencatat pengeluaran harian di Rincian Transaksi.
6. Dashboard menampilkan alokasi, realisasi, sisa, status, dan estimasi vs realisasi.

## Integrasi Backend

- Base URL API: `/api`.
- Response dibaca lewat `res.data.data`.
- Error validasi dari `error.validationErrors`.
- Interceptor `services/api.js` sudah menangani auth redirect dan error umum.
- Halaman finance/master tidak boleh menduplikasi logic redirect auth.

## Helper Yang Dibutuhkan

Tambahkan saat implementasi modul:

- `src/utils/formatters.js`
  - `formatCurrency(value)`
  - `formatSignedCurrency(value)`
  - `formatDate(value)`
  - `formatPeriod(year, month)`
- `src/utils/budgetStatus.js`
  - mapping `safe`, `near_limit`, `over_budget` ke label, warna, dan badge

## Perintah Umum

```bash
npm ci
npm start
npm run lint
npm run build
```
