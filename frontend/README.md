# Castra - Frontend Application

Antarmuka web modern (*Single Page Application*) untuk **Castra**, platform pencatatan dan perencanaan keuangan pribadi. Dibangun menggunakan **React 19**, **CoreUI 5**, **Vite**, dan **Redux Toolkit**.

---

## 🎨 Fitur Antarmuka Pengguna

- **Dashboard Finansial Responsif**: Ringkasan KPI keuangan bulanan, saldo kumulatif, serta daftar transaksi terkini.
- **Kalender Transaksi Interaktif**:
  - Kalender harian untuk modul **Pemasukan** dan **Pengeluaran**.
  - Klik tanggal untuk melihat rincian transaksi atau membuka modal formulir penambahan data.
  - Toggle cepat antara tampilan kalender visual dan tabel data tabular.
- **Master Data dengan Split Layout**:
  - Kolom kiri untuk daftar tabel data dengan pagination dan filter pencarian.
  - Kolom kanan untuk formulir tambah/edit yang cepat dan intuitif.
  - Mendukung Sumber Pemasukan, Kategori Transaksi, Kelompok Anggaran, dan Siklus Anggaran.
- **Laporan Visual & Komprehensif**:
  - Laporan Arus Kas 12 bulan (*Cash Flow*).
  - Laporan Realisasi Anggaran dengan indikator status (*Aman*, *Mendekati Batas*, *Over Budget*).
  - Laporan Rincian Beban Kategori per kelompok alokasi.
- **Profil Pengguna & Avatar**:
  - Formulir profil pribadi (Nama, Email, dan Foto Profil).
  - Modal pemotong gambar (*Avatar Circular Cropper*) interaktif dengan format output WebP/Base64.
  - Formulir penggantian kata sandi dengan verifikasi sandi saat ini.
- **Manajemen Hak Akses & Pengaturan**:
  - Pengelolaan Pengguna (*Users*) dan Peran (*Roles*).
  - Pengaturan Hak Akses Menu (*Role Permissions*).
  - Pengaturan Identitas Perusahaan/Aplikasi (*Company Settings*).

---

## 📂 Struktur Direktori `src/`

```text
frontend/src/
├── assets/             # Gambar, ikon, dan berkas statis
├── components/         # Komponen global yang dapat digunakan kembali
│   ├── header/         # AppHeader, AppHeaderDropdown, breadcrumbs
│   ├── AppFooter.js    # Komponen footer aplikasi
│   ├── AppSidebar.js   # Navigasi sidebar dinamis sesuai role
│   ├── AppToastProvider.js # Provider notifikasi toast global
│   └── AvatarCropModal.js  # Modal interaktif crop foto profil lingkaran
├── layout/             # Layout utama aplikasi (DefaultLayout)
├── scss/               # Styling kustom CoreUI & SCSS aplikasi
├── services/           # Service API client (Axios), interceptor, dan toast
│   ├── api.js          # Konfigurasi Axios & error interceptor
│   ├── authService.js  # Penanganan token dan sesi login
│   ├── sidebarService.js # Pemetaan ikon menu dinamis
│   └── toastService.js # Helper pemicu notifikasi toast
├── store/              # Redux store untuk state global aplikasi
├── views/              # Halaman-halaman tampilan aplikasi
│   ├── dashboard/      # Halaman dashboard finansial
│   ├── incomes/        # Modul Pemasukan (Kalender & Tabel)
│   ├── expenses/       # Modul Pengeluaran (Kalender & Tabel)
│   ├── reports/        # Laporan Arus Kas, Realisasi Anggaran, Kategori
│   ├── master/         # Master Data (Sumber Dana, Kategori, Anggaran)
│   ├── profile/        # Pengaturan profil pengguna & foto
│   ├── setup/          # Manajemen Pengguna, Peran, Menu, Perusahaan
│   └── pages/          # Halaman publik (Login, 404, 500)
├── App.js              # Komponen utama aplikasi & routing
├── index.js            # Entry point React DOM
├── routes.js           # Konfigurasi mapping route URL ke komponen view
└── _nav.js             # Struktur default navigasi sidebar
```

---

## 💻 Panduan Pengembangan Lokal

### Persyaratan:
- **Node.js** versi 20 atau 22+
- **npm** versi 10+
- Backend Castra yang sedang berjalan (port 9001 via Docker atau port 8000 lokal).

### 1. Instalasi Dependensi:
```bash
npm install
```

### 2. Konfigurasi Proxy API:
Saat pengembangan lokal, Vite secara otomatis meneruskan permintaan `/api` ke backend melalui konfigurasi di `vite.config.mjs`:
```javascript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:9001', // atau http://127.0.0.1:8000
      changeOrigin: true,
    },
  },
}
```

### 3. Menjalankan Server Pengembangan:
```bash
npm start
```
Buka browser di [http://localhost:3000](http://localhost:3000).

---

## 🔨 Perintah yang Tersedia

| Perintah | Deskripsi |
| --- | --- |
| `npm start` | Menjalankan server pengembangan Vite di port 3000 dengan Hot Module Replacement (HMR) |
| `npm run build` | Melakukan kompilasi aset production ke folder `build/` |
| `npm run lint` | Menjalankan pemeriksaan kualitas kode dengan ESLint |
| `npm run preview` | Meninjau hasil kompilasi build production secara lokal |

---

## 🐳 Deployment Menggunakan Docker

Frontend Castra dikemas menggunakan **multi-stage build**:
1. **Stage 1 (Build)**: Menggunakan image Node.js 22 untuk menginstal dependensi dan membangun bundel React ke folder `build/`.
2. **Stage 2 (Runtime)**: Menggunakan image Nginx Alpine yang sangat ringan dan aman untuk menyajikan berkas statis dengan dukungan SPA fallback (`index.html`), gzip compression, dan security headers.

Untuk memperbarui build frontend di container yang sedang berjalan:
```bash
# Kompilasi ulang dan update container frontend
docker compose build frontend
docker compose up -d frontend
```

---

## 🔐 Penanganan Autentikasi & Interceptor

- **Penyimpanan Token**: Token Bearer Sanctum disimpan di browser setelah login berhasil dan disisipkan otomatis ke header setiap permintaan API (`Authorization: Bearer <token>`).
- **Respon Error Global**:
  - `401 Unauthorized`: Menghapus sesi lokal dan mengarahkan pengguna kembali ke halaman login.
  - `403 Forbidden`: Mengarahkan pengguna ke halaman akses ditolak.
  - `422 Unprocessable Content`: Menampilkan pesan validasi pada field formulir terkait.
  - `500 Server Error`: Menampilkan pesan kesalahan melalui toast notification di pojok kanan atas.
