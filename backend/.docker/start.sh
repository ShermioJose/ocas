#!/bin/bash
chmod -R 777 /var/www/storage /var/www/bootstrap/cache
rm -f /var/www/storage/logs/laravel.log
set -e

# Run migrations
php artisan migrate --force

# Seed database (only if needed)
php artisan db:seed --force || true

# Cache config
php artisan config:clear
php artisan config:cache
php artisan route:cache

# Start supervisor
/usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
