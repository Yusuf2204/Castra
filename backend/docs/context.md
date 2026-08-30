# Project Context (Singkat)

Proyek React CMS v1 dirancang sebagai sistem manajemen konten lengkap dengan fitur:
- Autentikasi token menggunakan Laravel Sanctum (backend)
- CRUD users dan roles
- Menu bertingkat dan navigasi berbasis role
- Pengaturan identitas perusahaan (logo, favicon)
- Dashboard ringkas dengan ringkasan data
- Dokumentasi API terbuka melalui Swagger/OpenAPI
- Penanganan error dan validasi terpusat di frontend
- Deployment menggunakan Docker Compose dengan tiga layanan: nginx (reverse proxy), backend (Laravel + PHP-FPM + Nginx + Supervisor), frontend (React build served by Nginx)
- Variabel lingkungan disimpan di .env di root dan diteruskan ke masing-masing container melalui docker-compose.yml
- Frontend menggunakan Vite dev server yang mem-proxy /api ke backend saat development; production build disajikan oleh Nginx dalam container frontend.
Semua hal ini menjadikannya siap untuk development lokal serta produksi dengan Docker.