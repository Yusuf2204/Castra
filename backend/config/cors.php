<?php

$csv = static fn (string $key, string $default = ''): array => array_values(array_filter(
    array_map('trim', explode(',', (string) env($key, $default)))
));

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => $csv('CORS_ALLOWED_METHODS', 'GET,POST,PUT,PATCH,DELETE,OPTIONS'),
    'allowed_origins' => $csv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000'),
    'allowed_origins_patterns' => [],
    'allowed_headers' => $csv('CORS_ALLOWED_HEADERS', 'Accept,Authorization,Content-Type,Origin,X-Requested-With'),
    'exposed_headers' => [],
    'max_age' => (int) env('CORS_MAX_AGE', 600),
    'supports_credentials' => filter_var(
        env('CORS_SUPPORTS_CREDENTIALS', false),
        FILTER_VALIDATE_BOOL
    ),
];
