#!/bin/bash
set -e
echo "Waiting for postgres database to be ready..."
until /usr/bin/pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing command"

echo "Applying database migrations using SQL script..."
export PGPASSWORD="$DB_PASSWORD"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME --file /app/migrations.sql --quiet
unset PGPASSWORD

echo "Migrations applied. Starting application..."
exec dotnet /app/CoursesAPI.dll
