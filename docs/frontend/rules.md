# Frontend Rules - Castra

Aturan wajib untuk implementasi frontend Castra.

## Prinsip Umum

- Gunakan function components + hooks.
- Gunakan `prop-types` untuk props komponen.
- Ikuti pola `<View>.js`, `<View>Form.js`, `<View>Table.js`.
- Route di-lazy lewat `React.lazy` di `src/routes.js`.
- Semua request API lewat `src/services/api.js`.
- Error field tampil dekat input; feedback umum lewat toast.

## Organisasi Modul

```text
src/views/finance/
|-- incomes/
|-- transactions/
|-- monthlyPlans/
`-- monthlySummaries/

src/views/master/
|-- incomeSources/
|-- budgetGroups/
`-- categories/
```

Jangan mencampur halaman master ke `setup`; `setup` dipakai untuk administrasi
sistem, sedangkan `master` dipakai untuk domain keuangan Castra.

## Aturan Domain UI

- Pemasukan adalah workflow pertama dalam periode.
- UI tidak menghitung final allocation secara mandiri; tampilkan hasil dari backend.
- Preview boleh dihitung di frontend, tetapi angka final setelah save harus dari API.
- Input nominal selalu positif. Tanda plus/minus hanya untuk tampilan.
- Emergency ditampilkan sebagai `Reserve` atau `Emergency Reserve` dari sisa
  rencana. Jangan menjumlahkannya sebagai pembagian tambahan di total utama.
- Kategori expense wajib memilih pembagian budget.
- Kategori income tidak wajib memilih pembagian budget.
- Jangan hardcode data default workbook di komponen; ambil dari API/seed backend.

## State Management

- Redux hanya untuk `sidebarShow`, `theme`, `user`, `company`, `navigation`.
- Data halaman seperti list, filter, form, pagination, dan summary memakai
  `useState`/`useEffect` lokal.
- Filter periode sebaiknya disimpan lokal per halaman. Jangan simpan di
  `localStorage` kecuali ada kebutuhan eksplisit.

## API dan Error Handling

- Baca data response lewat `res.data.data`.
- Baca validasi lewat `error.validationErrors`.
- Gunakan `getFieldError(errors, 'field')` untuk error field.
- Interceptor sudah menangani 401, 403, 404, 5xx, dan network error.
- Jangan membuat redirect auth tambahan di halaman.
- Setiap request punya `loading`.
- Tombol submit disabled saat loading.
- Setelah create/update/delete, refresh list atau update state secara konsisten.

## Format Angka dan Tanggal

- Buat dan pakai `src/utils/formatters.js` untuk format reusable.
- Uang:

  ```js
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })
  ```

- Tanggal kirim ke API: `YYYY-MM-DD`.
- Tanggal tampil: locale `id-ID`.
- Nominal tabel memakai `text-end` dan tabular nums.
- Pemasukan tampil dengan tanda `+` dan class `text-success`.
- Pengeluaran tampil dengan tanda `-` dan class `text-danger`.

## Status Budget

Gunakan mapping konsisten:

| Status API | Label | Badge |
| --- | --- | --- |
| `safe` | Aman | success |
| `near_limit` | Mendekati Batas | warning |
| `over_budget` | Over Budget | danger |

Status harus tampil sebagai teks/badge, bukan warna saja.

## UI/UX

- Tabel wajib punya empty state.
- Loading memakai `CSpinner` atau skeleton sesuai pola existing.
- Hapus data selalu lewat dialog konfirmasi.
- Form modal reset saat dibuka ulang.
- Form edit dan create boleh satu komponen jika validasi tetap jelas.
- Filter yang banyak ditempatkan dalam panel/collapse agar tabel tetap dominan.
- Jangan menambahkan landing page; dashboard adalah layar utama setelah login.

## Styling

- Styling di `src/scss/`, bukan inline style, kecuali nilai benar-benar dinamis.
- Pakai class CoreUI/Bootstrap lebih dulu.
- Dukung dark mode dengan variabel CoreUI.
- Hindari layout card di dalam card.
- Pastikan teks tombol dan badge tidak terpotong pada mobile.

## Menu dan Navigasi

- Sidebar menu bersumber dari `navigation` Redux yang dikirim backend.
- Route tetap harus ada di frontend untuk path menu baru.
- Jangan hardcode visibility menu berdasarkan role di frontend.
- Jika user tidak punya permission, backend navigation tidak mengirim menu itu.

## Kualitas

- Sebelum selesai, jalankan:
  - `npm run lint`
  - `npm run build`
- Jangan commit `node_modules/` dan hasil build.
- Test manual minimal:
  - login
  - membuka menu finance/master
  - create/update/delete master
  - catat pemasukan dan lihat alokasi
  - catat pengeluaran dan lihat status budget berubah
