#!/bin/sh

# Usage: ./wait-for-db.sh ./backend

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-3306}"
RETRIES=10
WAIT=3

echo "⏳ Waiting for MySQL at $DB_HOST:$DB_PORT..."

for i in $(seq 1 $RETRIES); do
    nc -z "$DB_HOST" "$DB_PORT" && break
    echo "⏱️  [$i/$RETRIES] Waiting for database..."
    sleep $WAIT
done

if ! nc -z "$DB_HOST" "$DB_PORT"; then
    echo "❌ Could not connect to MySQL at $DB_HOST:$DB_PORT after $RETRIES attempts."
    exit 1
fi

echo "✅ MySQL is up, starting app..."
exec "$@"
