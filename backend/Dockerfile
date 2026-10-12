# ============================================================
# React CMS Backend — PHP 8.3 FPM + Nginx (supervisor)
# ============================================================

FROM php:8.3-fpm-alpine

# ── system packages ──────────────────────────────────────────
# bash (entrypoint), curl (healthcheck), unzip (composer dist pkgs)
RUN apk add --no-cache \
    bash \
    curl \
    unzip \
    nginx \
    supervisor

# ── PHP extensions ──────────────────────────────────────────
# Compile against -dev headers, then remove them to keep the
# image slim. The runtime libs (freetype, libjpeg-turbo, …) are
# installed separately and stay for gd/mbstring/xml.
RUN apk add --no-cache --virtual .build-deps \
        linux-headers \
        libpng-dev \
        libjpeg-turbo-dev \
        freetype-dev \
        libwebp-dev \
        oniguruma-dev \
        libxml2-dev \
    && apk add --no-cache \
        libpng \
        libjpeg-turbo \
        freetype \
        libwebp \
        oniguruma \
        libxml2 \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_mysql \
        mbstring \
        xml \
        ctype \
        bcmath \
        gd \
    && apk del .build-deps

# ── Composer ─────────────────────────────────────────────────
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# ── working directory ────────────────────────────────────────
WORKDIR /var/www/html

# ── dependencies first (cache-friendly layer) ────────────────
# --no-scripts: post-autoload-dump would boot artisan, which needs
# the full source. Package discovery runs after the source copy.
COPY composer.json composer.lock ./
RUN composer install --no-interaction --prefer-dist \
    --no-progress --optimize-autoloader --no-scripts

# ── copy the rest of the source ──────────────────────────────
COPY . .

# ── package discovery + Swagger docs (baked into the image) ─
RUN php artisan package:discover --ansi \
    && php artisan l5-swagger:generate

# ── permissions (after generate, so log files stay www-data) ─
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# ── nginx config ─────────────────────────────────────────────
COPY nginx-backend.conf /etc/nginx/http.d/default.conf
RUN mkdir -p /run/nginx && chown -R www-data:www-data /run/nginx
RUN sed -i 's/user nginx;/user www-data;/' /etc/nginx/nginx.conf

# ── supervisor config ────────────────────────────────────────
COPY supervisor.conf /etc/supervisor/supervisord.conf

# ── entrypoint ───────────────────────────────────────────────
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisor/supervisord.conf"]
