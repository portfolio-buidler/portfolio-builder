# 1) Small Python base
FROM python:3.12-slim AS base

# 2) Cleaner Python defaults
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 PIP_NO_CACHE_DIR=1

# 3) Workdir
WORKDIR /app

# 4) os packages:
#    - ca-certificates: up-to-date trust store for HTTPS (pip)
#    - build-essential: only if wheels are missing and a package needs compilation
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates build-essential \
 && update-ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# 5) Copy pyproject so we know the deps
COPY pyproject.toml .

# 6) Install Python deps
RUN python -m pip install --upgrade pip \
 && python -m pip install --no-cache-dir \
      --trusted-host pypi.org --trusted-host files.pythonhosted.org \
      fastapi uvicorn[standard] SQLAlchemy>=2.0 psycopg[binary] python-multipart asyncpg alembic>=1.7 pydantic>=2.0 python-dotenv

# Install dependencies from pyproject.toml if it exists
RUN if [ -f pyproject.toml ]; then \
      python -m pip install --no-cache-dir \
        --trusted-host pypi.org --trusted-host files.pythonhosted.org \
        -e .; \
    fi

# 7) Copy source code
COPY alembic.ini ./
COPY alembic ./alembic
COPY ./app ./app
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# 8) Run as non-root
RUN useradd -m appuser && chown -R appuser /app
USER appuser

# 9) Expose FastAPI port
EXPOSE 9000

ENTRYPOINT ["/entrypoint.sh"]

# 10) Launch uvicorn (actual command is in entrypoint.sh)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "9000", "--reload"]