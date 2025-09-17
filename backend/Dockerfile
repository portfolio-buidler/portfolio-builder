# 1) Small Python base
FROM python:3.12-slim AS base

# 2) Cleaner Python defaults
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 PIP_NO_CACHE_DIR=1

# 3) Workdir
WORKDIR /app

# 4) (Optional) build tools in case deps need compiling later
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential \
 && rm -rf /var/lib/apt/lists/*

# 5) Copy pyproject so we know the deps
COPY pyproject.toml .

# 6) Install runtime deps explicitly (from pyproject)
#    Your pyproject lists: fastapi, uvicorn[standard]
RUN pip install --upgrade pip \
 && python -c "import tomllib,sys;print(' '.join(tomllib.load(open('pyproject.toml','rb'))['project']['dependencies']))" \
    | xargs -r pip install

# 7) Copy source code
COPY ./app ./app

# 8) Run as non-root
RUN useradd -m appuser && chown -R appuser /app
USER appuser

# 9) Expose FastAPI port
EXPOSE 8000

# 10) Launch uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
