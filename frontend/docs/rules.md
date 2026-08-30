# Project Rules (Singkat)

React CMS v1 adalah aplikasi CMS berbasis Laravel (backend) dan React (frontend). 
Frontend merupakan single-page application dibangun dengan React 19, Vite 7, Redux, dan CoreUI. 
Frontend berkomunikasi dengan backend Laravel melalui endpoint /api (menggunakan axios dengan baseURL '/api'). 
Selama development, Vite dev server melakukan proxy request /api ke backend lokal (http://localhost:8000). 
Dalam produksi, Nginx dalam container frontend menyajikan hasil build dan mengarahkan semua rute tidak ditemukan ke index.html (SPA fallback), serta mem-proxy request /api ke container backend melalui reverse proxy nginx di root. 
Autentikasi ditangani dengan menyimpan token JWT dari respons login dan menambahkannya sebagai header Authorization pada setiap request yang membutuhkan otentikasi. 
Frontend juga menangani respons error umum (401, 403, 404, 422, 500) dengan interceptor Axios untuk mengarahkan pengguna ke halaman login, forbidden, not found, menampilkan validasi field, atau menampilkan toast error.