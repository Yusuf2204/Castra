# Frontend Design — Aplikasi Pencatatan Keuangan

## Fondasi

UI dibangun di atas **CoreUI 5 (free)** React Admin Template. Komponen, layout,
dan konvensi styling mengikuti CoreUI; penyesuaian dilakukan lewat SCSS,
bukan menulis ulang komponen.

Referensi resmi:

- Demo: https://coreui.io/demos/react/latest/free/?theme=light#/dashboard
- Dokumentasi: https://coreui.io/react/
- Template dasar: https://github.com/coreui/coreui-free-react-admin-template

## Prinsip Desain

1. **Angka dulu** — di aplikasi keuangan, nominal, saldo, dan tren adalah konten utama.
2. **Semantik warna uang** — pemasukan hijau (`success`), pengeluaran merah (`danger`).
   Jangan memakai warna lain untuk dua arah ini.
3. **Konsisten dengan modul existing** — halaman baru mengikuti pola setup
   (tabel + form modal + filter + konfirmasi hapus).
4. **Nominal mudah dibanding** — format IDR (`Intl.NumberFormat('id-ID')`)
   dan angka tabular (monospace) agar digit sejajar di tabel.

## Layout

- **AppSidebar**: menu dari state Redux `navigation` (backend mengirim menu per role).
  Kelompok menu yang direncanakan: Dashboard · Keuangan (Transaksi, Kategori,
  Ringkasan Bulanan) · Setup (Users, Roles, Menus, Role Permissions, Company).
- **AppHeader**: breadcrumb, toggle sidebar, dropdown user (Change Password, Logout).
- **AppContent**: container-fluid — semua halaman dirender di sini.
- **AppFooter**: versi aplikasi & copyright.
- **Branding dinamis**: judul tab & favicon mengikuti `company` dari Redux (`App.js`).

## Halaman & Komponen

### Dashboard Keuangan

- Baris kartu ringkasan (4 kartu): Pemasukan bulan ini, Pengeluaran bulan ini,
  Saldo (net), Jumlah transaksi.
- Grafik tren 6 bulan terakhir: pemasukan vs pengeluaran (bar/line).
- Grafik komposisi pengeluaran per kategori (donat).
- Tabel transaksi terbaru (5–10 baris) + tautan ke halaman transaksi.
- Kartu memakai `CCard`/`CWidgetStats` CoreUI.

### Transaksi

- Filter: rentang tanggal (start–end), pilih kategori, pilih tipe
  (Semua/Pemasukan/Pengeluaran).
- Tabel kolom: Tanggal · Deskripsi · Kategori · Jumlah (hijau/merah) · Aksi.
- Form (modal): pilih kategori (tipenya menentukan arah transaksi), tanggal
  (date picker), deskripsi, nominal. Validasi per field memakai pola
  `getFieldError` existing.
- Aksi: edit (modal yang sama), hapus (konfirmasi, lalu toast sukses).
- Nominal di input tanpa pemisah ribuan; format tampilan lewat helper formatter.

### Kategori

- Tabs: Pemasukan | Pengeluaran (komponen tab CoreUI).
- Tabel: Nama · Tipe · Aksi (edit/hapus).
- Menghapus kategori yang masih dipakai transaksi ditolak backend (422) —
  tampilkan pesan dari `error.validationErrors`.

### Ringkasan Bulanan

- Picker bulan + tahun (`CFormSelect`).
- Kartu: Total Pemasukan, Total Pengeluaran, Net.
- Breakdown per kategori (tabel/donat).

### Halaman Setup (existing)

- Tetap sebagaimana adanya — modul keuangan tidak mengubah pola ini.

## Warna & Grafik

- **Pemasukan**: variabel success CoreUI (hijau) — nominal positif, tanda `+`.
- **Pengeluaran**: variabel danger CoreUI (merah) — nominal negatif, tanda `−`.
- **Netral**: palet abu CoreUI untuk teks, border, background.
- Grafik memakai warna semantik yang sama — konsisten antara kartu, tabel, dan grafik.
- Dark mode: ikuti mekanisme CoreUI (`useColorModes`), jangan hardcode warna —
  pakai variabel CSS CoreUI.

## Ikonografi

Pakai set ikon CoreUI (`@coreui/icons-react`):

| Ikon | Penggunaan |
| --- | --- |
| `cilChartLine` | Dashboard, tren |
| `cilMoney` | Nominal, transaksi |
| `cilArrowTop` / `cilArrowBottom` | Pemasukan / pengeluaran |
| `cilTag` | Kategori |
| `cilCalendar` | Ringkasan bulanan, filter tanggal |
| `cilTrash` / `cilPencil` | Aksi tabel |

## Tipografi & Aksesibilitas

- Font sistem (default CoreUI); angka nominal pakai tabular-nums / monospace.
- Kontras minimal 4.5:1; status tidak boleh disampaikan hanya lewat warna —
  nominal selalu diberi tanda +/−.
- Setiap tabel punya empty state yang jelas; loading pakai spinner/skeleton
  dengan pola existing.
- Modal/drawer mengikuti pola fokus & keyboard CoreUI.

## Responsivitas

- Mobile (<768px): sidebar collapse (hamburger), kartu menumpuk,
  tabel pakai scroll horizontal.
- Tablet (768–1024px): sidebar collapsed by default.
- Desktop (>1024px): sidebar terbuka.

## Catatan Implementasi

1. Modul keuangan dibuat di `src/views/finance/` mengikuti pola `View/Form/Table`.
2. Tambahkan rute baru di `src/routes.js` dengan `React.lazy`.
3. Menu sidebar (ikon + label + urutan) dikirim dari backend (`menus` +
   `role_menus`) — jangan hardcode menu keuangan di frontend.
4. Override styling lewat `src/scss/` (variabel CoreUI), hindari inline style.
5. Sebelum menambah dependensi chart: manfaatkan pendekatan sederhana dulu;
   jika perlu library, pilih satu dan gunakan konsisten di semua grafik.
