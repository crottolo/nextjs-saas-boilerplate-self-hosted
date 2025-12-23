#!/bin/sh
set -e

echo "Running database migrations..."
node scripts/migrate.mjs

echo "Seeding admin user..."
node scripts/seed-admin.mjs

echo "Starting server..."
exec node server.js
