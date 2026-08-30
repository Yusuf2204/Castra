#!/bin/bash
# ============================================================
# React CMS Backend — Docker Entrypoint
# ============================================================

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  React CMS Backend — starting up"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── ensure .env exists ──────────────────────────────────────
if [ ! -f .env ]; then
  echo "→ .env not found, copying from .env.example…"
  cp .env.example .env
fi

# ── generate app key if missing ─────────────────────────────
# docker-compose passes APP_KEY="" as a real environment variable,
# which shadows the value written to .env (Laravel's dotenv is
# immutable and refuses to overwrite existing env vars, even empty
# ones). Export the generated key so every subsequent artisan
# process and PHP-FPM worker (clear_env=no) sees the real value.
if [ -z "$APP_KEY" ]; then
  echo "→ APP_KEY is empty, generating…"
  php artisan key:generate --force --no-interaction
  APP_KEY="$(grep -E '^APP_KEY=' .env | tail -n1 | cut -d= -f2-)"
  export APP_KEY
  echo "✓ APP_KEY generated"
else
  echo "✓ APP_KEY already set"
fi

# ── wait for database ───────────────────────────────────────
# The PHP probe must exit non-zero on failure, otherwise `until`
# treats a swallowed PDO exception as success and proceeds too early.
echo "→ waiting for database at ${DB_HOST}:${DB_PORT}…"
tries=0
until php -r "
    try {
        new PDO('${DB_CONNECTION}:host=${DB_HOST};port=${DB_PORT};dbname=${DB_DATABASE}', '${DB_USERNAME}', '${DB_PASSWORD}');
        exit(0);
    } catch (\Throwable \$e) {
        exit(1);
    }
" 2>/dev/null; do
  tries=$((tries + 1))
  if [ "$tries" -ge 60 ]; then
    echo "✗ database not reachable after 120s"
    exit 1
  fi
  sleep 2
done
echo "✓ database ready"

# ── run migrations ──────────────────────────────────────────
echo "→ running migrations…"
php artisan migrate --force --no-interaction
echo "✓ migrations done"

# ── seed reference data on first boot ───────────────────────
# Seeders are guarded (firstOrCreate / exists-checks), but only run
# them while no users exist: fresh deployments get roles, menus,
# company and (when ADMIN_EMAIL/ADMIN_PASSWORD are set) the admin.
if php -r '
    require "vendor/autoload.php";
    $app = require "bootstrap/app.php";
    $app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
    exit(Illuminate\Support\Facades\DB::table("users")->count() > 0 ? 1 : 0);
'; then
  echo "→ first boot detected, seeding database…"
  php artisan db:seed --force --no-interaction
  echo "✓ database seeded"
else
  echo "→ users exist, skipping seed"
fi

# ── generate Swagger docs when needed ───────────────────────
if [ "${L5_SWAGGER_GENERATE_ALWAYS:-false}" = "true" ] || [ ! -f storage/api-docs/api-docs.json ]; then
  echo "→ generating Swagger documentation…"
  php artisan l5-swagger:generate
  echo "✓ swagger docs ready"
fi

# ── optimize caches ─────────────────────────────────────────
echo "→ optimizing caches…"
php artisan optimize
echo "✓ caches optimized"

# ── artisan commands above ran as root — hand storage back ──
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Backend is ready — starting services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exec "$@"
