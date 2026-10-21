# Castra - Solusi Pencatatan & Perencanaan Keuangan Pribadi

**Castra** adalah aplikasi manajemen dan perencanaan keuangan pribadi modern yang dirancang untuk membantu Anda memantau, merencanakan, dan mengendalikan arus kas harian secara cerdas, visual, dan mudah digunakan.

Dengan Castra, Anda dapat dengan mudah mengetahui ke mana setiap rupiah dialokasikan, mencegah "kebocoran halus" pada pengeluaran bulanan, dan memastikan target tabungan tercapai sesuai rencana.

---

## ✨ Fitur Unggulan

### 📊 1. Dashboard Finansial Pintar
- **Ringkasan Seketika**: Pantau total saldo, total pemasukan, dan total pengeluaran bulan berjalan dalam satu layar ringkas.
- **Indikator Kesehatan Finansial**: Metrik persentase pengeluaran terhadap pemasukan untuk menjaga keuangan tetap sehat.
- **Aktivitas Terkini**: Daftar transaksi terbaru yang mudah dipantau tanpa harus membuka halaman lain.

### 💰 2. Pencatatan Pemasukan Fleksibel
- **Sumber Dana Terkelola**: Catat pemasukan dari berbagai sumber, seperti gaji bulanan, bonus, proyek freelance, investasi, atau bisnis sampingan.
- **Tampilan Kalender Interaktif**: Lihat pemasukan Anda dalam bentuk kalender bulanan. Cukup klik pada tanggal tertentu untuk melihat rincian atau menambah transaksi baru secara langsung.

### 💳 3. Pengendalian Pengeluaran & Pagu Anggaran
- **Pos Belanja Terorganisir**: Klasifikasikan pengeluaran harian ke dalam berbagai kategori kebutuhan (makanan, transportasi, tagihan, hiburan, dll.).
- **Peringatan Pagu Otomatis**: Setiap kategori pengeluaran dilengkapi indikator status visual:
  - 🟢 **Aman**: Pengeluaran masih jauh di bawah batas rencana.
  - 🟡 **Mendekati Batas**: Pengeluaran telah mencapai 80% atau lebih dari anggaran yang ditetapkan.
  - 🔴 **Over Budget**: Pengeluaran telah melampaui batas anggaran yang direncanakan.
- **Mode Tampilan Ganda**: Beralih dengan mudah antara tampilan tabel daftar transaksi atau tampilan kalender harian.

### 📈 4. Laporan & Evaluasi Lengkap
- **Arus Kas Tahunan (*Cash Flow*)**: Laporan pergerakan kas masuk dan kas keluar selama 12 bulan beserta saldo kumulatif.
- **Realisasi Anggaran Bulanan**: Evaluasi seberapa disiplin rencana belanja Anda terhadap kenyataan pengeluaran per kategori.
- **Rincian Komposisi Belanja**: Analisis proporsi pengeluaran berdasarkan kelompok pos anggaran untuk evaluasi gaya hidup.

### 🗓️ 5. Siklus & Kelompok Anggaran Fleksibel
- **Siklus Anggaran Berbasis Tanggal Gajian**: Keuangan tidak harus dimulai dari tanggal 1 hingga akhir bulan. Anda dapat mengatur siklus anggaran yang fleksibel mengikuti tanggal gajian Anda (misalnya tanggal 25 hingga tanggal 24 bulan berikutnya).
- **Alokasi Anggaran**: Kelompokkan pos belanja sesuai formula perencanaan keuangan Anda (seperti Kebutuhan Pokok, Keinginan, Tabungan/Investasi, dan Dana Darurat).

### 👤 6. Profil Pengguna & Personalisasi
- **Foto Profil Kustom**: Sesuaikan foto profil akun dengan fitur pemotong gambar (*image cropper*) lingkaran yang rapi.
- **Keamanan Akun**: Ubah kata sandi dan perbarui informasi akun kapan saja dengan mudah.

---

## 🚀 Cara Menjalankan Aplikasi (Mulai Cepat)

Aplikasi Castra sudah dikemas menggunakan **Docker**, sehingga Anda tidak perlu menginstal database atau konfigurasi server yang rumit di komputer Anda.

### Persyaratan:
- Komputer dengan **Docker** dan **Docker Compose** terpasang.

### Langkah-langkah:

1. **Jalankan Aplikasi:**
   Buka terminal di folder proyek Castra, lalu jalankan:
   ```bash
   docker compose up -d
   ```

2. **Buka Aplikasi di Browser:**
   - **Aplikasi Web**: [http://localhost](http://localhost) (atau [http://localhost:9002](http://localhost:9002))
   - **Dokumentasi API (Swagger)**: [http://localhost:9001](http://localhost:9001)

3. **Masuk Menggunakan Akun Bawaan:**
   - **Email**: `admin@example.com`
   - **Kata Sandi**: `adminpassword123`

Untuk menghentikan aplikasi jika sudah selesai digunakan:
```bash
docker compose down
```

---

## 🌐 Akses Layanan & Port

| Layanan | Alamat URL | Keterangan |
| --- | --- | --- |
| **Aplikasi Web Castra** | `http://localhost` | Antarmuka pengguna utama (Frontend React) |
| **Backend API & Swagger** | `http://localhost:9001` | Dokumentasi REST API interaktif (OpenAPI) |
| **Direct Frontend** | `http://localhost:9002` | Akses langsung ke container frontend |

---

## 🛠️ Informasi untuk Pengembang (Developer Corner)

Bagi pengembang yang ingin berkontribusi atau memodifikasi kode Castra:

### Stack Teknologi:
- **Frontend**: React 19, CoreUI 5, Redux Toolkit, React Router 7, Vite 7.
- **Backend**: Laravel 12, PHP 8.3+, Laravel Sanctum (Autentikasi Bearer Token), L5-Swagger.
- **Database**: MySQL 8.0.
- **Infrastruktur**: Nginx Reverse Proxy, Docker Compose.

### Struktur Proyek:
```text
castra/
├── frontend/             # Kode antarmuka React 19 SPA
├── backend/              # Kode API backend Laravel 12
├── nginx/                # Konfigurasi reverse proxy
├── docs/                 # Dokumentasi PRD, arsitektur, dan aturan kode
├── docker-compose.yml    # Konfigurasi orkestrasi container
└── README.md             # Panduan utama aplikasi
```

### Panduan Teknis Lanjutan:
- Dokumentasi teknis frontend: silakan baca [frontend/README.md](frontend/README.md).
- Dokumentasi teknis backend: silakan baca [backend/README.md](backend/README.md).
- Menjalankan tes otomatis backend:
  ```bash
  docker exec castra-backend php artisan test
  ```

---

## 📄 Lisensi
Hak Cipta © 2026 Tim Castra. Seluruh hak cipta dilindungi undang-undang.
