# Buku Panduan Pengguna (User Manual Book)
## Castra Financial & Management System

> **Versi:** 1.0.0  
> **Tanggal Pembaruan:** Oktober 2026  
> **Platform:** Web Responsive (Desktop, Tablet, Mobile)  
> **Akses Aplikasi:** `http://localhost/` (atau via port `9002` untuk frontend langsung)

---

## Daftar Isi
1. [Pendahuluan & Konsep Utama](#1-pendahuluan--konsep-utama)
2. [Akses & Autentikasi](#2-akses--autentikasi)
   - [Halaman Login](#halaman-login)
   - [Profil & Ganti Kata Sandi](#profil--ganti-kata-sandi)
   - [Logout / Keluar Akun](#logout--keluar-akun)
3. [Navigasi & Tampilan Antarmuka](#3-navigasi--tampilan-antarmuka)
4. [Dashboard Keuangan (Eksekutif & Analitik)](#4-dashboard-keuangan-eksekutif--analitik)
5. [Modul Master Data](#5-modul-master-data)
   - [Sumber Dana (Income Sources)](#51-sumber-dana-income-sources)
   - [Alokasi Anggaran (Budget Groups 50/30/20)](#52-alokasi-anggaran-budget-groups-503020)
   - [Kategori Transaksi (Categories)](#53-kategori-transaksi-categories)
6. [Modul Pemasukan (Incomes)](#6-modul-pemasukan-incomes)
   - [Pencatatan Pemasukan Baru](#61-pencatatan-pemasukan-baru)
   - [Tampilan Tabel & Filter](#62-tampilan-tabel--filter)
   - [Tampilan Kalender Pemasukan](#63-tampilan-kalender-pemasukan)
7. [Modul Pengeluaran (Expenses)](#7-modul-pengeluaran-expenses)
   - [Pencatatan Pengeluaran Baru](#71-pencatatan-pengeluaran-baru)
   - [Tampilan Tabel & Filter](#72-tampilan-tabel--filter)
   - [Tampilan Kalender Pengeluaran](#73-tampilan-kalender-pengeluaran)
8. [Modul Laporan Keuangan (Reports)](#8-modul-laporan-keuangan-reports)
   - [Laporan Arus Kas Tahunan (Cash Flow)](#81-laporan-arus-kas-tahunan-cash-flow)
   - [Laporan Realisasi vs Anggaran (Budget Comparison)](#82-laporan-realisasi-vs-anggaran-budget-comparison)
   - [Laporan Breakdown Beban Kategori](#83-laporan-breakdown-beban-kategori)
9. [Modul Pengaturan Sistem (Setup)](#9-modul-pengaturan-sistem-setup)
   - [Profil Perusahaan / Identitas Sistem](#91-profil-perusahaan--identitas-sistem)
   - [Manajemen Pengguna (Users)](#92-manajemen-pengguna-users)
   - [Manajemen Peran (Roles) & Hak Akses (Permissions)](#93-manajemen-peran-roles--hak-akses-permissions)
   - [Pengaturan Menu Dinamis](#94-pengaturan-menu-dinamis)
10. [Panduan Troubleshooting & FAQ](#10-panduan-troubleshooting--faq)

---

## 1. Pendahuluan & Konsep Utama

**Castra** adalah platform manajemen keuangan pribadi dan bisnis yang dibangun dengan prinsip **4 Pilar Perencanaan Keuangan**:
1. **Master Keuangan:** Pemisahan pos alokasi anggaran (*Needs*, *Wants*, *Savings*, *Debt/Obligation*) serta pemetaan sumber dana.
2. **Pencatatan Arus Kas:** Pelacakan pemasukan dan pengeluaran secara real-time dengan antarmuka ganda (Tabel Riwayat & Kalender Harian).
3. **Budget Envelope System:** Penerapan formula alokasi teruji (default rule 50/30/20) untuk mencegah pemborosan sebelum terjadi.
4. **Analitik & Evaluasi:** Pelaporan otomatis arus kas bulanan/tahunan, persentase tabungan (*savings rate*), dan deteksi *over-budget*.

Data keuangan setiap akun bersifat **terisolasi aman** (*multi-user isolated*), sehingga transaksi Anda hanya dapat dilihat dan dikelola oleh akun Anda sendiri.

---

## 2. Akses & Autentikasi

### Halaman Login
1. Buka browser web (Google Chrome, Mozilla Firefox, Microsoft Edge, atau Safari).
2. Masukkan URL: **`http://localhost/`** atau `http://localhost:9002/`.
3. Anda akan diarahkan ke halaman Login.
4. Masukkan kredensial akun Anda:
   - **Email:** contoh `admin@example.com`
   - **Password:** contoh `adminpassword123`
5. Klik tombol **Login**.
6. Sistem akan memvalidasi data dan mengarahkan Anda langsung ke halaman **Dashboard**.

### Profil & Ganti Kata Sandi
Untuk menjaga keamanan akun:
1. Klik avatar profil di pojok kanan atas header, lalu pilih **Ubah Password** (atau melalui menu Setup bagi Administrator).
2. Masukkan **Password Lama**, kemudian ketikkan **Password Baru** (minimal 6 karakter), dan konfirmasi kembali.
3. Klik **Save Password**. Sistem akan menyimpan password baru dan mengarahkan kembali ke halaman login.

### Logout / Keluar Akun
1. Di bagian kanan atas (header navigasi), klik avatar profil pengguna.
2. Pilih menu **Logout**.
3. Sesi token Anda akan ditutup dan Anda akan dikembalikan ke halaman login.

---

## 3. Navigasi & Tampilan Antarmuka

Antarmuka Castra terbagi menjadi 3 area utama:
- **Sidebar (Menu Kiri):** Menu navigasi utama yang disesuaikan secara dinamis berdasarkan hak akses peran (*Role Permissions*):
  - **Menu Pengguna (User):** Fokus pada operasional keuangan personal:
    1. **Dashboard** (`/dashboard`)
    2. **Pemasukan** (`/incomes`)
    3. **Pengeluaran** (`/expenses`)
    4. **Laporan** (`/reports`)
    5. **Master Data** (`/master` ➔ *Sumber Dana, Kategori, Alokasi Anggaran*)
  - **Menu Administrator (Admin):** Memiliki seluruh modul keuangan di atas ditambah modul administrasi sistem:
    6. **Setup** (`/setup` ➔ *Users, Roles, Role Permissions, Menus, Company*)
- **Header (Atas):** Berisi toggle sidebar, indikator breadcrumb halaman saat ini, dan dropdown avatar profil (menampilkan nama akun, link **Ubah Password**, dan **Logout**).
- **Main Content (Tengah):** Area kerja tempat formulir, tabel data, kalender, diagram grafik, dan laporan ditampilkan.

---

## 4. Dashboard Keuangan (Eksekutif & Analitik)

Menu: **Dashboard** (`/dashboard`)

Halaman Dashboard memberikan gambaran kesehatan keuangan Anda secara instan dalam bulan berjalan:

### 1. Kartu Ringkasan Finansial (KPI Cards)
- **Total Pemasukan Bulan Ini:** Total akumulasi uang masuk pada bulan berjalan.
- **Total Pengeluaran Bulan Ini:** Total akumulasi uang keluar pada bulan berjalan.
- **Sisa / Tabungan Bersih:** Selisih pendapatan dikurangi pengeluaran (*Net Savings*).
- **Utilisasi Anggaran:** Persentase seberapa banyak pengeluaran Anda dibandingkan total pendapatan bulan ini.

### 2. Status Amplop Anggaran (Budget Envelopes)
Menampilkan progress bar realisasi terhadap batas aman untuk masing-masing kelompok:
- 🟢 **Aman (Hijau):** Pengeluaran masih di bawah 80% dari batas alokasi.
- 🟡 **Peringatan (Kuning):** Pengeluaran sudah mencapai 80% - 100% dari alokasi.
- 🔴 **Over Budget (Merah):** Pengeluaran telah melampaui alokasi yang ditentukan.

### 3. Riwayat Transaksi Terbaru
Daftar 5 transaksi terakhir (pemasukan & pengeluaran) lengkap dengan tanggal, kategori, dan nominal.

---

## 5. Modul Master Data

Menu induk: **Master**

Sebelum mencatat transaksi, pastikan data referensi telah disiapkan sesuai kebutuhan Anda.

---

### 5.1 Sumber Dana (Income Sources)
Menu: **Master > Sumber Dana** (`/master/income-sources`)

Digunakan untuk mendefinisikan dari mana uang Anda berasal (misal: Rekening Payroll, Dompet Tunai, Tabungan Bisnis, Freelance).

* **Menambah Sumber Dana:**
  1. Klik tombol **Tambah Sumber Dana** (+).
  2. Isi **Nama Sumber Dana** (contoh: *Gaji Kantor*, *Penjualan Online*).
  3. Isi **Keterangan** (opsional).
  4. Centang status **Aktif**.
  5. Klik tombol **Simpan**.
* **Mengedit / Menghapus:**
  - Klik tombol aksi **Edit** (ikon pensil) pada baris data untuk mengubah.
  - Klik tombol **Hapus** (ikon tempat sampah) untuk menghapus. *Catatan: Sumber dana yang telah memiliki transaksi tidak dapat dihapus untuk mencegah kerusakan riwayat arus kas.*

---

### 5.2 Alokasi Anggaran (Budget Groups 50/30/20)
Menu: **Master > Alokasi Anggaran** (`/master/budget-groups`)

Kelompok anggaran membagi pendapatan Anda ke dalam pos perencanaan strategis:
- **Need (Kebutuhan Pokok - 50%):** Makanan, tempat tinggal, utilitas, transportasi wajib.
- **Want (Keinginan & Gaya Hidup - 30%):** Hiburan, belanja hobi, rekreasi, makan di luar.
- **Savings (Tabungan & Investasi - 20%):** Dana darurat, reksadana, emas, tabungan masa depan.
- **Debt / Obligation:** Cicilan terencana atau kewajiban berkala.

* **Mengelola Kelompok:**
  - Anda dapat mengubah persentase batas alokasi sesuai profil keuangan pribadi Anda.
  - Anda dapat menambahkan kelompok kustom baru jika diperlukan.
  - Kelompok bawaan sistem (*System Groups*) dilindungi dari penghapusan tidak disengaja.

---

### 5.3 Kategori Transaksi (Categories)
Menu: **Master > Kategori** (`/master/categories`)

Pos detail transaksi untuk membedakan pos pemasukan dan pos pengeluaran.

* **Menambah Kategori Baru:**
  1. Klik tombol **Tambah Kategori** (+).
  2. Masukkan **Nama Kategori** (contoh: *Makan & Minum*, *Listrik & Air*, *Gaji Pokok*).
  3. Pilih **Tipe**:
     - **Pemasukan (Income):** Untuk pos pendapatan.
     - **Pengeluaran (Expense):** Untuk pos belanja/pengeluaran.
  4. Jika memilih tipe **Pengeluaran**, Anda **wajib memilih Kelompok Anggaran** (misal: *Need*, *Want*, atau *Savings*).
  5. Masukkan **Estimasi Bulanan (Target Budget)** dalam Rupiah (opsional, sebagai patokan target bulanan).
  6. Klik tombol **Simpan**.

---

## 6. Modul Pemasukan (Incomes)

Menu: **Pemasukan** (`/incomes`)

Digunakan untuk mencatat semua dana masuk ke rekening atau kas Anda.

### 6.1 Pencatatan Pemasukan Baru
1. Pada halaman Pemasukan, klik tombol **Catat Pemasukan** (+).
2. Lengkapi formulir transaksi:
   - **Sumber Dana:** Pilih sumber dana (misal: *BCA Payroll*, *Kas Tunai*).
   - **Kategori (Opsional):** Pilih kategori pemasukan (misal: *Gaji Bulanan*, *Bonus*).
   - **Tanggal Transaksi:** Pilih tanggal penerimaan dana (format: YYYY-MM-DD).
   - **Jumlah (Nominal):** Masukkan angka nominal rupiah (contoh: `10000000`).
   - **Catatan / Keterangan:** Tuliskan detail keterangan transaksi (contoh: *Gaji pokok bulan Oktober*).
3. Klik tombol **Simpan Transaksi**.
4. Sistem akan otomatis memperbarui saldo dan riwayat transaksi.

### 6.2 Tampilan Tabel & Filter
- **Filter Pencarian:** Cari transaksi berdasarkan kata kunci catatan atau nama sumber dana.
- **Filter Periode Bulan:** Pilih bulan tertentu untuk menyaring data per siklus gajian.
- **Pagination:** Gunakan navigasi halaman di bawah tabel untuk melihat riwayat lampau.
- **Aksi:** Tombol **Edit** dan **Hapus** tersedia di setiap baris.

### 6.3 Tampilan Kalender Pemasukan
- Klik tab atau tombol **Mode Kalender**.
- Sistem menampilkan visualisasi kalender bulanan lengkap dengan total pemasukan di setiap tanggal.
- Klik pada tanggal tertentu untuk melihat rincian transaksi pada hari tersebut.

---

## 7. Modul Pengeluaran (Expenses)

Menu: **Pengeluaran** (`/expenses`)

Digunakan untuk mencatat setiap pengeluaran uang secara disiplin dan akurat.

### 7.1 Pencatatan Pengeluaran Baru
1. Pada halaman Pengeluaran, klik tombol **Catat Pengeluaran** (+).
2. Lengkapi data formulir:
   - **Kategori Pengeluaran:** Pilih kategori (misal: *Makan & Minum*, *Bensin*, *Belanja Bulanan*). Kelompok anggarannya (*Need/Want/Savings*) akan otomatis terdeteksi.
   - **Tanggal Transaksi:** Pilih tanggal transaksi terjadi.
   - **Jumlah (Nominal):** Masukkan nominal rupiah yang dikeluarkan.
   - **Catatan / Keterangan:** Masukkan detail pembelian (misal: *Makan siang bersama tim*, *Bayar tagihan Indihome*).
3. Klik tombol **Simpan Pengeluaran**.

### 7.2 Tampilan Tabel & Filter
- **Filter Kategori & Kelompok Anggaran:** Saring transaksi berdasarkan kelompok tertentu (misal: hanya ingin melihat pengeluaran kelompok *Want*).
- **Filter Rentang Waktu / Bulan:** Analisis pengeluaran minggu ini atau bulan tertentu.
- **Aksi:** Anda dapat memperbarui nominal jika ada perubahan atau menghapus entri yang salah input.

### 7.3 Tampilan Kalender Pengeluaran
- Beralih ke **Mode Kalender** untuk melihat distribusi beban harian Anda.
- Kalender menampilkan total rupiah harian sehingga Anda dapat mengetahui hari-hari di mana terjadi pengeluaran terbesar (*peak spending days*).

---

## 8. Modul Laporan Keuangan (Reports)

Menu: **Laporan** (`/reports`)

Modul ini menyajikan 3 jenis laporan komprehensif untuk evaluasi finansial:

### 8.1 Laporan Arus Kas Tahunan (Cash Flow)
- **Fungsi:** Melihat arus kas masuk vs keluar dari bulan Januari hingga Desember pada tahun yang dipilih.
- **Metrik Utama:**
  - **Total Pemasukan Tahunan** & **Total Pengeluaran Tahunan**.
  - **Net Savings:** Sisa akumulasi tabungan bersih sepanjang tahun.
  - **Savings Rate (%):** Persentase pendapatan yang berhasil disisihkan menjadi tabungan (indikator kebebasan finansial).
  - **Tabel 12 Bulan:** Kolom Pemasukan, Pengeluaran, Saldo Bersih Bulanan, dan Saldo Kumulatif berjalan.

### 8.2 Laporan Realisasi vs Anggaran (Budget Comparison)
- **Fungsi:** Menguji kepatuhan pengeluaran terhadap batas formula 50/30/20.
- **Fitur Laporan:**
  - Pemilih filter bulan (misal: `2026-10`).
  - Perbandingan antara **Alokasi Ideal (Target Rp)** vs **Realisasi Belanja Riil (Aktual Rp)**.
  - **Indikator Status Otomatis:**
    - `Aman` (pengeluaran wajar).
    - `Mendekati Limit` (di atas 80%).
    - `Melebihi Limit / Over Budget` (melebihi 100%).

### 8.3 Laporan Breakdown Beban Kategori
- **Fungsi:** Mengidentifikasi pos kategori mana yang paling banyak menyerap anggaran belanja Anda.
- **Fitur Laporan:**
  - Daftar seluruh kategori pengeluaran yang aktif dalam bulan terpilih.
  - Perbandingan realisasi pengeluaran terhadap **Estimasi Bulanan**.
  - Persentase kontribusi beban kategori terhadap total pengeluaran bulan tersebut.

---

## 9. Modul Pengaturan Sistem (Setup)

Menu induk: **Setup**  
*(Khusus untuk Akun dengan Role Administrator)*

### 9.1 Profil Perusahaan / Identitas Sistem
Menu: **Setup > Company** (`/setup/company`)
- Mengatur Nama Aplikasi, Alamat, Nomor Kontak, serta Logo dan Favicon sistem.

### 9.2 Manajemen Pengguna (Users)
Menu: **Setup > Users** (`/setup/users`)
- Menambah akun pengguna baru.
- Mengatur status aktif/non-aktif akun.
- Menentukan Peran (*Role*) untuk setiap pengguna.

### 9.3 Manajemen Peran (Roles) & Hak Akses (Permissions)
Menu: **Setup > Roles** & **Setup > Role Permissions**
- Membuat peran kustom (misal: *Admin*, *Staff Keuangan*, *Pengguna Reguler*).
- Menentukan menu apa saja yang boleh dibuka dan dioperasikan oleh masing-masing peran.

### 9.4 Pengaturan Menu Dinamis
Menu: **Setup > Menus** (`/setup/menus`)
- Mengatur urutan tampilan menu sidebar, ikon menu, dan hierarki sub-menu (*parent-child*).

---

## 10. Panduan Troubleshooting & FAQ

#### Q: Mengapa kategori tidak bisa saya hapus?
> **Jawab:** Sistem menerapkan integritas data akuntansi. Kategori yang sudah pernah digunakan pada riwayat transaksi pemasukan atau pengeluaran tidak boleh dihapus agar laporan masa lalu tidak menjadi rusak/hilang. Solusinya: nonaktifkan centang **Aktif** pada kategori tersebut agar tidak muncul lagi pada opsi transaksi baru.

#### Q: Mengapa persentase alokasi anggaran saya bertuliskan 'Over Budget'?
> **Jawab:** Hal ini menandakan total pengeluaran Anda pada kelompok anggaran tersebut (*misal: pos Want/Gaya Hidup*) sudah melebihi porsi persentase yang Anda tetapkan dari total pendapatan bulan berjalan. Kurangi pengeluaran pada pos tersebut hingga bulan berikutnya.

#### Q: Bagaimana jika saya salah memasukkan nominal transaksi?
> **Jawab:** Buka menu **Pemasukan** atau **Pengeluaran**, cari transaksi pada tabel riwayat, klik tombol **Edit** (ikon pensil), ubah nominal atau catatan, lalu klik **Simpan**. Laporan dan Dashboard akan langsung diperbarui secara instan.

#### Q: Apakah data saya dapat diakses oleh user lain di komputer yang sama?
> **Jawab:** Tidak. Setiap transaksi terikat secara ketat ke User ID pemilik akun yang sedang login. Pastikan Anda selalu menekan tombol **Logout** setelah selesai menggunakan aplikasi.
