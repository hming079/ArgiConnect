#!/bin/sh
set -eu

DATABASE="${POSTGRES_DB:-agriconnect}"
HOST="${POSTGRES_HOST:-postgres}"
USER="${POSTGRES_USER:-postgres}"
SEED_FILE="${SEED_FILE:-/seed/agriconnect_synthetic_seed.sql}"

if [ ! -s "$SEED_FILE" ]; then
  echo "Seed file not found or empty: $SEED_FILE" >&2
  exit 1
fi

export PGPASSWORD="$POSTGRES_PASSWORD"

echo "Loading synthetic business data into core_schema..."
PGOPTIONS="-c search_path=core_schema" \
  psql --host="$HOST" --username="$USER" --dbname="$DATABASE" \
    --set=ON_ERROR_STOP=1 --file="$SEED_FILE"

echo "Synchronizing ID-preserving users into auth_schema..."
psql --host="$HOST" --username="$USER" --dbname="$DATABASE" \
  --set=ON_ERROR_STOP=1 <<'SQL'
BEGIN;
TRUNCATE TABLE auth_schema.password_reset_tokens, auth_schema.users RESTART IDENTITY CASCADE;
INSERT INTO auth_schema.users
    (id, full_name, email, password_hash, phone, role, status, created_at, updated_at)
SELECT id, full_name, email, password_hash, phone, role, status, created_at, updated_at
FROM core_schema.users
ORDER BY id;
SELECT setval(
    pg_get_serial_sequence('auth_schema.users', 'id'),
    COALESCE((SELECT MAX(id) FROM auth_schema.users), 1),
    true
);
COMMIT;
SQL

echo "Synthetic seed completed successfully."
