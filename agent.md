# Agent Guidelines - Castra

Castra adalah aplikasi pencatatan dan perencanaan keuangan pribadi berbasis gaji.
Fokus produk: setiap pemasukan dicatat, dialokasikan ke pembagian anggaran,
lalu pemakaian harian dipantau terhadap budget bulanan.

## Konteks Produk

Referensi awal berasal dari `docs/Keuangan_September_2026.xlsx`.
Workbook itu memiliki tiga sheet utama:

- `Estimasi`: master sumber dana, pembagian 50/30/20, kategori pengeluaran,
  estimasi per kategori, dan budget per pembagian.
- `Rincian`: catatan pemakaian harian. Kolom pengeluaran menarik pembagian
  dan budget dari `Estimasi`.
- `Dashboard`: ringkasan total alokasi, realisasi, sisa alokasi, status budget,
  dan estimasi vs realisasi.

Prinsip utama yang harus dipertahankan:

- Pemasukan adalah titik awal siklus bulanan.
- Alokasi default mengikuti 50% Need, 30% Fun, 20% Saving.
- Kategori pengeluaran selalu berada di bawah satu pembagian budget.
- Emergency bukan persentase utama; default-nya adalah sisa rencana setelah
  estimasi kategori dihitung. Jangan menghitung Emergency sebagai tambahan
  yang membuat total budget melebihi pemasukan.
- Transaksi/rincian adalah sumber realisasi. Dashboard dan summary adalah
  data turunan.

## Istilah Domain

| Istilah | Makna |
| --- | --- |
| Sumber Dana | Master asal pemasukan, contoh: Gaji, Bonus, Freelance |
| Pemasukan | Transaksi masuk aktual pada periode tertentu |
| Pembagian Budget | Envelope anggaran, default: Need, Fun, Saving; Emergency sebagai reserve turunan |
| Kategori | Pos pemakaian di bawah pembagian, contoh: Makan, Bensin, Kuota |
| Rencana Bulanan | Estimasi budget kategori untuk satu bulan |
| Rincian | Transaksi harian pemasukan/pengeluaran |
| Realisasi | Total transaksi aktual yang sudah dicatat |
| Sisa Budget | Budget dikurangi realisasi |

## Menu Master Castra

Menu minimal yang harus diarahkan oleh backend dan frontend:

1. `Dashboard`
2. `Keuangan`
   - `Pemasukan`
   - `Rincian Transaksi`
   - `Rencana Bulanan`
   - `Ringkasan Bulanan`
3. `Master`
   - `Sumber Dana`
   - `Pembagian Budget`
   - `Kategori`
4. `Setup`
   - `Company`
   - `Users`
   - `Roles`
   - `Menus`
   - `Role Permissions`
   - `Change Password`

## Logic Inti

Saat ada pemasukan:

1. User memilih sumber dana, tanggal, periode bulan/tahun, nominal, dan catatan.
2. Sistem membuat transaksi pemasukan bernilai positif.
3. Sistem membuat alokasi budget untuk periode tersebut berdasarkan profil
   pembagian aktif. Default:
   - Need = 50% x pemasukan
   - Fun = 30% x pemasukan
   - Saving = 20% x pemasukan
4. Jika dalam periode yang sama ada beberapa pemasukan, sistem menjumlahkan
   pemasukan teralokasi per periode dan menghitung ulang budget.
5. Estimasi kategori mengurangi budget pembagian masing-masing. Sisa estimasi
   dapat ditampilkan sebagai `unplanned/reserve`; Emergency berasal dari sisa ini
   bila user ingin memisahkannya.
6. Pengeluaran harian mengurangi realisasi kategori dan pembagian.
7. Status budget:
   - `Over Budget` jika sisa < 0
   - `Mendekati Batas` jika sisa / budget <= 20%
   - `Aman` untuk kondisi lainnya

## Aturan Kerja Agen

- Baca dokumen di `docs/backend/*` dan `docs/frontend/*` sebelum mengubah kode
  modul keuangan.
- Jangan mengubah migrasi lama. Jika master baru diperlukan, buat migrasi baru.
- Ikuti pola existing Laravel API dan React CoreUI.
- Nama kode, route, kolom, dan model memakai bahasa Inggris. Label UI boleh
  berbahasa Indonesia.
- Semua fitur keuangan harus di-scope ke user login.
- Sebelum implementasi besar, pastikan desain data mendukung banyak pemasukan
  dalam satu bulan, bukan hanya satu gaji.
