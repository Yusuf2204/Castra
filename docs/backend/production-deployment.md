# Production Deployment — Backend

Panduan deployment aplikasi pencatatan keuangan ke server production.
Seluruh stack dijalankan lewat Docker Compose dari **root proyek**
(file `docker-compose.yml`).

## Arsitektur Stack

| Service | Container | Host Port | Keterangan |
| --- | --- | --- | --- |
| nginx proxy | `react-cms-proxy` | 80 | Satu-satunya entry publik |
| backend | `react-cms-backend` | 9001 | Laravel API (PHP-FPM + Nginx + Supervisor) |
| frontend | `react-cms-frontend` | 9002 | React SPA (Nginx static) |
| db | `react-cms-db` | 127.0.0.1:3306 | MySQL 8, hanya loopback |

Di production cukup buka port 80; port 9001/9002 hanya untuk debugging.

## Konfigurasi Environment

Isi root `.env` dengan nilai production:

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://domain-kamu

DB_PASSWORD=<password-kuat>
MYSQL_ROOT_PASSWORD=<password-root-kuat>

ADMIN_NAME=Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<minimal-12-karakter>

CORS_ALLOWED_ORIGINS=https://domain-kamu
```

- Biarkan `APP_KEY` **kosong** — `docker-entrypoint.sh` meng-generate dan
  meng-export-nya saat container start. Jangan mengisinya manual dengan nilai
  yang tidak sesuai (lihat `rules.md`, bagian gotchas).
- Jangan commit `.env` production ke version control.

## Deploy

```bash
docker compose down
docker compose up -d --build
docker compose ps
docker compose logs -f backend
```

Entrypoint backend menjalankan migrasi dan seed otomatis (seed hanya saat tabel
`users` kosong) — admin dibuat dari `ADMIN_*` di root `.env`.

## Backup Database (wajib sebelum migrasi/perubahan schema)

Backup lewat container `db`, bukan dari host:

```bash
mkdir -p /var/backups/castra
docker compose exec db sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' \
  | gzip > "/var/backups/castra/pre-migrate-$(date +%Y%m%d-%H%M%S).sql.gz"
```

Verifikasi backup sebelum lanjut:

```bash
gzip -t /var/backups/castra/pre-migrate-<timestamp>.sql.gz
```

Restore:

```bash
gunzip -c /var/backups/castra/pre-migrate-<timestamp>.sql.gz \
  | docker compose exec -T db sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'
```

Retensi yang disarankan:

- Harian: 14 hari.
- Mingguan: 8 minggu.
- Bulanan: 12 bulan.
- Simpan minimal satu salinan terenkripsi di luar server.
- Uji restore ke staging minimal sebulan sekali.

## Cache & Dokumentasi API

```bash
docker compose exec backend php artisan optimize:clear
docker compose exec backend php artisan config:cache
docker compose exec backend php artisan route:cache
docker compose exec backend php artisan view:cache
docker compose exec backend php artisan l5-swagger:generate
```

> `config:cache` aman dijalankan karena analyser kustom
> (`App\OpenApi\Analysers\DocBlockReflectionAnalyser`) bersifat serializable.
> Jangan mengganti `analyser` di `config/l5-swagger.php`.

## Scheduler

Prune token Sanctum yang kedaluwarsa lewat cron di host:

```cron
* * * * * docker compose -f /path/ke/castra/docker-compose.yml exec -T backend php artisan schedule:run >> /dev/null 2>&1
```

## Logging

- Log Laravel memakai channel `daily` (retensi 30 hari) dan disimpan di volume
  `react-cms-logs` — tidak hilang saat container di-recreate.
- Pantau ruang disk; ekspor log ke tempat terpusat bila perlu.

## Verifikasi Setelah Deploy

```bash
docker compose ps                                   # semua service healthy
curl --fail http://localhost/api/documentation      # Swagger bisa dibuka
curl --fail http://localhost/                        # frontend termuat
docker compose exec backend php artisan migrate:status
```

## Rollback

1. `docker compose down`
2. Restore database dari backup (lihat prosedur di atas)
3. Checkout versi git sebelumnya, lalu `docker compose up -d --build`
