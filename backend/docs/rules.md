# Project Rules (Singkat)

React CMS v1 adalah aplikasi CMS berbasis Laravel (backend) dan React (frontend). 
Backend menyediakan REST API dengan Laravel Sanctum untuk autentikasi token, manajemen users, roles, permissions, menu dinamis, pengaturan perusahaan, dan dashboard summary. 
Frontend adalah SPA yang dibangun dengan React 19, Vite 7, Redux, dan CoreUI, berkomunikasi dengan backend melalui proxy /api. 
Deployment menggunakan Docker dengan tiga container terpisah: nginx reverse proxy, backend (Laravel + Nginx + Supervisor), dan frontend (multi-stage Node build → Nginx Alpine). 
Semua konfigurasi diatur melalui environment variables di file .env di root proyek.