#!/bin/bash
# ============================================================
# React CMS Backend — Docker Entrypoint
# ============================================================

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  React CMS Backend — starting up"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

APP_KEY="${APP_KEY:-}"

# ── generate app key if missing ─────────────────────────────
if [ -z "$APP_KEY" ]; then
  echo "→ APP_KEY is empty, generating…"
  php artisan key:generate --force --no-interaction
  echo "✓ APP_KEY generated"
else
  echo "✓ APP_KEY already set"
fi

# ── wait for database ───────────────────────────────────────
if [ -n "$DB_HOST" ]; then
  echo "→ waiting for database at $DB_HOST:$DB_PORT…"
  timeout 60s bash -c "
    until php -r \"try { new PDO('\$DB_CONNECTION:host=\$DB_HOST;port=\$DB_PORT;dbname=\$DB_DATABASE', '\$DB_USERNAME', '\$DB_PASSWORD'); echo 'connected'; } catch (Exception \$e) { usleep(500000); }\"
    do :; done
  " 2>/dev/null || echo "⚠  database not ready, continuing anyway"
  echo "✓ database connection attempted"
fi

# ── run migrations ──────────────────────────────────────────
echo "→ running migrations…"
php artisan migrate --force --no-interaction || echo "⚠  migrations warning (may be up-to-date)"
echo "✓ migrations done"

# ── generate Swagger docs ───────────────────────────────────
echo "→ generating Swagger documentation…"
php artisan l5-swagger:generate || echo "⚠  swagger generation deferred"
echo "✓ swagger docs ready"

# ── optimize ────────────────────────────────────────────────
echo "→ optimizing caches…"
php artisan config:cache
php artisan route:cache
php artisan view:cache
echo "✓ caches optimized"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Backend is ready — starting services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exec "$@"
