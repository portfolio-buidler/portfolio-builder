#!/usr/bin/env sh

set -e

echo "[entrypoint] applying migrations..."
alembic upgrade head

echo "[entrypoint] starting app..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${BACKEND_PORT:-9000}" --reload