# Backend Design - Castra

## Prinsip Desain API

- RESTful dan resource-based.
- Semua response memakai envelope `{ "data", "message", "errors" }`.
- Semua endpoint keuangan berada dalam `auth:sanctum`.
- Semua data keuangan di-scope ke user login.
- Pemasukan, rencana, alokasi, transaksi, dan summary dipisah jelas.
- Sheet `Estimasi` menjadi dasar master/rencana; sheet `Rincian` menjadi dasar
  transaksi; sheet `Dashboard` menjadi dasar agregasi.

## Domain Model

### Sumber Dana

`income_sources` menyimpan master asal pemasukan.

Kolom yang disarankan:

- `id`
- `user_id`
- `name`
- `description`
- `is_active`
- timestamps

Contoh dari workbook: `Gaji`.

### Pembagian Budget

`budget_groups` menyimpan envelope anggaran.

Kolom yang disarankan:

- `id`
- `user_id`
- `code` (`need`, `fun`, `saving`, `emergency`)
- `name`
- `percentage`
- `sort_order`
- `is_system`
- `is_active`
- timestamps

Default:

| Code | Name | Percentage | Catatan |
| --- | --- | ---: | --- |
| `need` | Need | 50.00 | Kebutuhan utama |
| `fun` | Fun | 30.00 | Keinginan/gaya hidup |
| `saving` | Saving | 20.00 | Tabungan/investasi |
| `emergency` | Emergency | 0.00 | Reserve dari sisa rencana, bukan tambahan 50/30/20 |

Rule: total persentase group utama aktif harus 100%. Emergency tidak ikut
validasi 100% kecuali user sengaja mengubahnya menjadi group utama.

### Kategori

Tabel `categories` sudah ada. Tambahkan migrasi baru untuk mendukung:

- `budget_group_id` nullable untuk kategori pemasukan, wajib untuk kategori pengeluaran
- `monthly_estimate` opsional sebagai default estimasi kategori
- `is_active`

Kategori pengeluaran dari workbook:

| Kategori | Pembagian | Estimasi awal |
| --- | --- | ---: |
| Makan | Need | 1.240.000 |
| Bensin | Need | 250.000 |
| Kuota | Need | 100.000 |
| BPJS | Need | 150.000 |
| Laundry | Need | 100.000 |
| skincare | Fun | 200.000 |
| lainnya | Fun | 500.000 |
| Jajan | Fun | 300.000 |
| Saving | Saving | 790.272 |

### Rencana Bulanan

Rencana bulanan menggantikan fungsi utama sheet `Estimasi`.

Tabel yang disarankan:

- `monthly_plans`: `user_id`, `year`, `month`, `status`, `notes`
- `monthly_plan_incomes`: `monthly_plan_id`, `income_source_id`, `amount`, `received_at`, `notes`
- `monthly_plan_allocations`: `monthly_plan_id`, `budget_group_id`, `percentage`, `amount`
- `monthly_plan_items`: `monthly_plan_id`, `category_id`, `budget_group_id`, `estimated_amount`

Unique constraint utama: satu `monthly_plans` per `user_id + year + month`.

### Transaksi

Tabel `transactions` tetap menjadi sumber realisasi aktual:

- pemasukan bernilai positif
- pengeluaran bernilai negatif
- `category_id` menunjuk kategori income/expense
- tambahkan `income_source_id` nullable untuk transaksi pemasukan bila diperlukan

Untuk tampilan seperti `Rincian`, backend mengembalikan field turunan:

- `budget_group`
- `budget_amount`
- `realized_amount`
- `remaining_amount`
- `budget_status`

## Logic Pemasukan dan Alokasi

Saat user mencatat pemasukan:

1. Validasi `amount > 0`, `income_source_id`, tanggal, dan periode.
2. Simpan transaksi income dengan `amount` positif.
3. Upsert `monthly_plan` untuk periode transaksi.
4. Tambahkan atau update `monthly_plan_incomes`.
5. Hitung total pemasukan periode.
6. Hitung `monthly_plan_allocations` dari total pemasukan:
   - Need = total income x 50%
   - Fun = total income x 30%
   - Saving = total income x 20%
7. Hitung estimasi kategori dari `monthly_plan_items`.
8. Hitung reserve per pembagian:
   `allocation.amount - SUM(monthly_plan_items.estimated_amount)`.
9. Emergency default = total reserve positif dari rencana, terutama sisa Need/Fun/Saving.

Jika ada pemasukan tambahan di periode yang sama, budget periode dihitung ulang
dari total pemasukan teralokasi.

## Logic Pengeluaran

Saat user mencatat pengeluaran:

1. Validasi kategori bertipe `expense`.
2. Nominal input selalu positif di API, service menyimpan `amount` negatif.
3. Ambil `budget_group_id` dari kategori.
4. Realisasi pembagian = SUM nilai absolut transaksi expense untuk group tersebut.
5. Sisa budget = alokasi pembagian - realisasi pembagian.
6. Status:
   - `over_budget` jika sisa < 0
   - `near_limit` jika budget > 0 dan sisa / budget <= 0.2
   - `safe` untuk kondisi lainnya

## Endpoint Keuangan

| Metode | Path | Keterangan |
| --- | --- | --- |
| GET/POST | `/api/income-sources` | List/buat sumber dana |
| GET/PUT/DELETE | `/api/income-sources/{id}` | Detail/ubah/hapus sumber dana |
| GET/POST | `/api/budget-groups` | List/buat pembagian budget |
| GET/PUT/DELETE | `/api/budget-groups/{id}` | Detail/ubah/hapus pembagian |
| GET/POST | `/api/categories` | List/buat kategori, filter `type` dan `budget_group_id` |
| GET/PUT/DELETE | `/api/categories/{id}` | Detail/ubah/hapus kategori |
| GET/POST | `/api/monthly-plans` | List/buat rencana bulanan |
| GET/PUT | `/api/monthly-plans/{id}` | Detail/ubah rencana bulanan |
| POST | `/api/monthly-plans/{id}/allocate` | Hitung ulang alokasi dari pemasukan |
| GET/POST | `/api/transactions` | List/buat transaksi |
| GET/PUT/DELETE | `/api/transactions/{id}` | Detail/ubah/hapus transaksi |
| GET | `/api/monthly-summaries` | Summary periode |
| POST | `/api/monthly-summaries/recalculate` | Recalculate summary periode |
| GET | `/api/finance-dashboard` | Dashboard dari rencana + transaksi |

## Service Layer

```text
app/Services/
|-- NavigationService.php
`-- Finance/
    |-- AllocationService.php
    |-- BudgetStatusService.php
    |-- MonthlyPlanService.php
    |-- MonthlySummaryService.php
    `-- TransactionService.php
```

Tanggung jawab:

- `AllocationService`: menghitung 50/30/20 dan reserve/Emergency.
- `BudgetStatusService`: menghitung sisa dan status budget.
- `MonthlyPlanService`: CRUD rencana, item estimasi, dan sinkronisasi dari master.
- `TransactionService`: create/update/delete transaksi dan trigger recalculate.
- `MonthlySummaryService`: agregasi income, expense, net.

## Dashboard Aggregation

Dashboard mengikuti sheet `Dashboard`:

- Total alokasi = total pemasukan periode atau total allocation utama.
- Total realisasi = total expense absolut periode.
- Sisa alokasi = total alokasi - total realisasi.
- Kondisi per pembagian = budget group, budget, realisasi, sisa, status.
- Estimasi vs realisasi = kategori, estimasi, realisasi, selisih, persentase.
- Kesimpulan bulanan dibuat dari status pembagian.

## Menu Seeder

Tambahkan menu idempoten:

- `Dashboard` -> `/dashboard`
- `Keuangan` -> parent untuk `Pemasukan`, `Rincian Transaksi`,
  `Rencana Bulanan`, `Ringkasan Bulanan`
- `Master` -> parent untuk `Sumber Dana`, `Pembagian Budget`, `Kategori`
- `Setup` -> menu sistem existing

Seeder tidak boleh membuat duplikasi saat dijalankan ulang.

## Keamanan dan Kualitas

- Gunakan policy/scope query berbasis user untuk semua model keuangan.
- Validasi `year`, `month`, tanggal, nominal, dan relasi antar master.
- Cegah hapus master yang masih dipakai transaksi/rencana; return 422.
- Endpoint list memakai paginasi.
- Test minimal: alokasi 50/30/20, pemasukan tambahan dalam bulan yang sama,
  status budget, scope user, dan recalculate summary.
- Semua endpoint baru wajib memiliki anotasi OpenAPI.
