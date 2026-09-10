# Backend Rules - Castra

Aturan wajib untuk implementasi backend Castra.

## Struktur dan Penamaan

- Semua controller API berada di `app/Http/Controllers/Api/`.
- Controller tipis: validasi di controller, business logic di service.
- Model Eloquent berada di `app/Models/`.
- Logic keuangan berada di `app/Services/Finance/`.
- API Resource berada di `app/Http/Resources/`.
- Jangan mengubah migrasi lama. Tambahkan migrasi baru untuk kolom/tabel baru.
- Nama kode, route, kolom, dan model memakai bahasa Inggris.

## Aturan Domain Keuangan

- Pemasukan adalah sumber alokasi periode.
- Default pembagian: Need 50%, Fun 30%, Saving 20%.
- Total persentase group utama aktif harus 100%.
- Emergency default adalah reserve dari sisa rencana, bukan alokasi tambahan
  yang membuat total budget melebihi pemasukan.
- Kategori pengeluaran wajib punya `budget_group_id`.
- Kategori pemasukan boleh tidak punya `budget_group_id`.
- Transaksi tetap memakai satu kolom `amount` bertanda:
  pemasukan positif, pengeluaran negatif.
- API menerima nominal input sebagai angka positif; service yang menentukan
  tanda berdasarkan tipe transaksi/kategori.
- Tanggal memakai format `Y-m-d`; periode memakai `year` + `month`.
- Summary dan dashboard adalah data turunan. Jangan menjadikan summary sebagai
  sumber kebenaran.

## Aturan API

- Semua response memakai envelope:

  ```json
  { "data": { }, "message": "OK", "errors": null }
  ```

- Error validasi 422 berisi pesan per field di `errors`.
- Semua route keuangan berada dalam grup `auth:sanctum`.
- Semua query keuangan wajib melalui user login, contoh:
  `$request->user()->transactions()`.
- Dilarang mengembalikan atau memodifikasi data keuangan milik user lain.
- Endpoint list wajib mendukung paginasi dan filter yang relevan.
- Hapus master yang masih dipakai harus ditolak dengan 422.

## Alokasi Pemasukan

Saat membuat/mengubah/menghapus pemasukan:

1. Simpan transaksi income bernilai positif.
2. Upsert rencana bulanan sesuai tanggal/periode.
3. Hitung total income periode.
4. Recalculate allocation Need/Fun/Saving dari persentase aktif.
5. Recalculate reserve/Emergency dari sisa estimasi kategori.
6. Recalculate `monthly_summaries`.

Operasi harus idempoten: menjalankan recalculate berkali-kali menghasilkan
angka yang sama.

## Pengeluaran dan Status Budget

Saat membuat/mengubah/menghapus pengeluaran:

1. Simpan transaksi expense bernilai negatif.
2. Ambil pembagian dari kategori.
3. Recalculate realisasi kategori dan pembagian.
4. Recalculate summary periode.

Status budget:

- `over_budget`: sisa < 0
- `near_limit`: budget > 0 dan sisa / budget <= 0.2
- `safe`: kondisi lainnya

Label Indonesia (`Over Budget`, `Mendekati Batas`, `Aman`) dibuat di resource
atau frontend, bukan disimpan sebagai teks utama bila enum status sudah cukup.

## Seeder dan Menu

- Seeder wajib idempoten (`firstOrCreate`, `updateOrCreate`, atau guard jelas).
- Menu Castra minimal:
  `Dashboard`, `Keuangan`, `Master`, `Setup`.
- Submenu keuangan:
  `Pemasukan`, `Rincian Transaksi`, `Rencana Bulanan`, `Ringkasan Bulanan`.
- Submenu master:
  `Sumber Dana`, `Pembagian Budget`, `Kategori`.
- Permission role harus ikut dibuat untuk admin agar menu baru langsung muncul.

## Autentikasi dan Keamanan

- Pertahankan pola Sanctum di `AuthController`: satu token aktif per user.
- Rate limit login (`throttle:5,1`) dipertahankan.
- Jangan commit `.env`, token, password, atau secret.
- Jangan menulis data sensitif ke log.
- Validasi ownership relasi: kategori, sumber dana, budget group, dan rencana
  yang dipakai transaksi harus milik user yang sama.

## Swagger / OpenAPI

- Anotasi OpenAPI ditulis sebagai PHPDoc di controller.
- Jangan menyentuh bagian `analyser` di `config/l5-swagger.php`.
- Generate ulang dokumentasi setelah menambah endpoint:
  `php artisan l5-swagger:generate`.

## Kualitas Kode

- Format dengan Laravel Pint.
- Test dengan PHPUnit.
- Test wajib untuk:
  - alokasi 50/30/20 dari pemasukan
  - pemasukan tambahan dalam periode yang sama
  - Emergency sebagai reserve, bukan double count
  - status `safe`, `near_limit`, `over_budget`
  - isolasi data antar user
  - recalculate summary setelah transaksi berubah
