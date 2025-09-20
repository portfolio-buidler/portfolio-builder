#!/usr/bin/env sh

set -e

echo "[migrate] applying database migrations..."
alembic upgrade head
echo "[migrate] migrations completed successfully!"