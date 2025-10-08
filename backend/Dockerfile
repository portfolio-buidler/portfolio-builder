# 1) Small Python base
FROM python:3.12-slim AS base

# 2) Cleaner Python defaults
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# 3) Workdir
WORKDIR /app

# 4) OS packages:
#    - ca-certificates: TLS trust for pip, requests, db drivers
#    - build-essential/gcc/libpq-dev: compile psycopg2/asyncpg wheels if needed
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates build-essential libpq-dev gcc \
 && update-ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# 5) Copy PyProject early for better layer caching
COPY pyproject.toml .

# 6) Install Python deps (includes email-validator + multipart via extras)
RUN python -m pip install --upgrade pip \
 && python -m pip install --no-cache-dir -e .

# 7) Copy source code and runtime files
COPY alembic.ini ./
COPY alembic ./alembic
COPY ./app ./app
COPY docker/entrypoint.sh /entrypoint.sh
COPY docker/migrate.sh ./docker/migrate.sh
RUN chmod +x /entrypoint.sh ./docker/migrate.sh

# 8) Create writable dirs and non-root user
RUN mkdir -p /app/uploads \
 && useradd -m appuser \
 && chown -R appuser:appuser /app
USER appuser

# 9) Expose FastAPI port
EXPOSE 9000

# 10) Entrypoint handles migrations + app start
ENTRYPOINT ["/entrypoint.sh"]

# 11) Uvicorn command (the entrypoint uses this CMD)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "9000", "--reload"]
