# Production Deployment

## Environment

Copy `.env.production.example` to the production server as `.env`, then set real
database credentials, domains, `APP_KEY`, and a unique admin password.

Required production values:

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.example.com
```

Never commit the production `.env`.

## Database Backup

Create a timestamped backup before every migration:

```bash
mkdir -p /var/backups/react-cms
mysqldump --single-transaction --routines --triggers \
  -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -p \
  "$DB_DATABASE" | gzip > "/var/backups/react-cms/pre-migrate-$(date +%Y%m%d-%H%M%S).sql.gz"
```

Verify the backup before migrating:

```bash
gzip -t /var/backups/react-cms/pre-migrate-YYYYMMDD-HHMMSS.sql.gz
```

Run migrations only after the backup succeeds:

```bash
php artisan migrate --force
```

Restore procedure:

```bash
gunzip -c /var/backups/react-cms/backup.sql.gz \
  | mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -p "$DB_DATABASE"
```

Recommended retention:

- Daily backups: 14 days.
- Weekly backups: 8 weeks.
- Monthly backups: 12 months.
- Store at least one encrypted copy outside the application server.
- Test restore into a staging database at least monthly.

## Admin User

Set `ADMIN_NAME`, `ADMIN_EMAIL`, and a password of at least 12 characters, then:

```bash
php artisan db:seed --class=AdminUserSeeder --force
```

The seeder updates the configured admin account if it already exists.

## Cache And API Documentation

```bash
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan l5-swagger:generate
```

## Storage And Logging

The PHP-FPM/web-server user must be able to write to `storage` and
`bootstrap/cache`:

```bash
chown -R www-data:www-data storage bootstrap/cache
find storage bootstrap/cache -type d -exec chmod 775 {} \;
find storage bootstrap/cache -type f -exec chmod 664 {} \;
```

Production logging uses a daily channel:

```dotenv
LOG_CHANNEL=daily
LOG_LEVEL=warning
LOG_DAILY_DAYS=30
```

Monitor free disk space and rotate/export logs to centralized storage when
available.

## Scheduler

Sanctum expired tokens should be pruned by Laravel's scheduler:

```cron
* * * * * cd /var/www/react-cms/backend && php artisan schedule:run >> /dev/null 2>&1
```

## Deployment Verification

```bash
php artisan about --only=environment
php artisan migrate:status
php artisan route:list
curl --fail https://api.example.com/up
```
