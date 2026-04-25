#!/bin/bash
set -e

# Run migrations
php artisan migrate --force

# Seed database (only if needed)
php artisan db:seed --force || true

# Cache config
php artisan config:cache
php artisan route:cache

# Start supervisor
/usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
