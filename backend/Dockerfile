# ============================================================
# React CMS Backend — PHP 8.3 FPM + Nginx (supervisor)
# ============================================================

FROM php:8.3-fpm-alpine

# ── system packages ──────────────────────────────────────────
RUN apk add --no-cache \
    bash \
    curl \
    git \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    oniguruma-dev \
    linux-headers \
    libxml2-dev \
    zip \
    unzip \
    nginx \
    supervisor

# ── PHP extensions ───────────────────────────────────────────
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        mbstring \
        tokenizer \
        xml \
        ctype \
        bcmath \
        gd

# ── Composer ─────────────────────────────────────────────────
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# ── working directory ────────────────────────────────────────
WORKDIR /var/www/html

# ── copy source ──────────────────────────────────────────────
COPY . .

# ── dependencies ─────────────────────────────────────────────
RUN composer install --no-dev --no-interaction --optimize-autoloader

# ── permissions ──────────────────────────────────────────────
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# ── Swagger docs (generate at build so assets exist) ────────
RUN php artisan l5-swagger:generate || true

# ── nginx config ─────────────────────────────────────────────
COPY nginx-backend.conf /etc/nginx/http.d/default.conf
RUN mkdir -p /run/nginx && chown -R www-data:www-data /run/nginx
RUN sed -i 's/user nginx;/user www-data;/' /etc/nginx/nginx.conf

# ── supervisor config ────────────────────────────────────────
COPY supervisor.conf /etc/supervisor/conf.d/app.conf

# ── entrypoint ───────────────────────────────────────────────
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisor/supervisord.conf"]
