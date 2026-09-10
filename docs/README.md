# Dokumentasi Proyek — Aplikasi Pencatatan Keuangan

Dokumentasi proyek terpusat di folder `docs/` ini, dipisah per aplikasi.
Setiap jenis dokumen punya peran berbeda — baca sesuai kebutuhan:

| Dokumen | Peran | Isi |
| --- | --- | --- |
| `context.md` | **Gambaran** | Apa proyek ini, stack, modul, dan struktur — titik awal sebelum mengerjakan apa pun |
| `rules.md` | **Aturan** | Konvensi coding yang wajib diikuti saat menulis kode |
| `design.md` | **Rancangan** | Desain API & database (backend) atau desain UI (frontend) |
| `production-deployment.md` | **Operasional** | Khusus backend: prosedur deployment, backup, cache, rollback |

## Struktur

```text
docs/
├── README.md                    ← index ini
├── backend/
│   ├── context.md               ← gambaran backend (Laravel API)
│   ├── rules.md                 ← aturan coding backend
│   ├── design.md                ← desain API & database
│   └── production-deployment.md ← deployment production
└── frontend/
    ├── context.md               ← gambaran frontend (React SPA)
    ├── rules.md                 ← aturan coding frontend
    └── design.md                ← desain UI
```

## Panduan Penggunaan (Developer & AI Agent)

- Sebelum mulai mengubah kode: baca `context.md` aplikasi terkait.
- Saat menulis kode: ikuti `rules.md`.
- Saat menambah modul/fitur besar: konsultasikan `design.md`.
- Saat deploy ke server: ikuti `production-deployment.md`.
