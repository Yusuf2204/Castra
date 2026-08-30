# Project Context (Singkat)

Frontend React CMS v1 adalah bagian dari sistem manajemen konten yang terpisah dari backend Laravel. 
Berikut konteks penting:
- Struktur folder mencakup src/assets, src/components, src/layout, src/services, src/store, src/views, serta file konfigurasi seperti vite.config.mjs, routes.js, App.js, index.js.
- Layanan API berada di src/services/api.js yang membuat instance axios dengan baseURL '/api', sehingga deployment dapat berpindah tanpa mengubah kode.
- Interceptor Axios di src/services/api.js (atau dalam file terpisah) menangani status respons: 401 -> hapus token dan redirect ke login; 403 -> redirect ke halaman forbidden; 404 -> menampilkan halaman not found; 422 -> menampilkan error validasi per field; 500 -> menampilkan toast error.
- Navigasi sidebar dibangun secara dinamis dari data menu yang diterima dari backend berdasarkan peran pengguna; ikon Sidebar diatur di src/services/sidebarService.js.
- State global dikelola dengan Redux (src/store) yang menyimpan informasi pengguna, perusahaan, dan token.
- Build produksi dilakukan dengan perintah npm ci dan npm run build, menghasilkan folder build/ yang lalu disalin ke dalam runtime Nginx Alpine melalui multi-stage Docker build.
- Dockerfile frontend menggunakan tahap build Node.js 22 untuk menginstal dependensi dan membangun aplikasi, lalu tahap runtime Nginx Alpine menyajikan hasil build.
- Konfigurasi Nginx internal (nginx.conf) menyediakan fallback SPA (usahakan semua rute ke index.html), kompresi gzip, header cache untuk aset statis, dan beberapa header keamanan.
- Semua environment variables tidak diperlukan pada fase build karena API menggunakan jalur relatif /api; deployment menggunakan nginx reverse proxy di host untuk meneruskan /api ke container backend.
Dengan konteks ini, frontend siap untuk dijalankan secara lokal (npm start) maupun melalui produksi Docker (docker compose up -d).