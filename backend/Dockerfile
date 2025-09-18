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
#    We do two things:
#    A) Upgrade pip
#    B) Install runtime dependencies using trusted-host flags (for corp proxies)
#       - If your pyproject lists them, pip will just satisfy from there.
#       - We also include the core deps explicitly to avoid drift early on.
############################
RUN python -m pip install --upgrade pip \
 && python -m pip install --no-cache-dir \
      --trusted-host pypi.org --trusted-host files.pythonhosted.org \
      fastapi uvicorn[standard] sqlalchemy psycopg[binary] python-multipart asyncpg

# (Optional) If you later add more deps to pyproject.toml and want them auto-installed,
# uncomment this block to parse and install everything declared there:
# RUN python - <<'PY'
# import tomllib, sys, subprocess, pathlib
# deps = tomllib.load(open('pyproject.toml','rb')).get('project', {}).get('dependencies', [])
# if deps:
#     subprocess.check_call([sys.executable, "-m", "pip", "install",
#         "--no-cache-dir", "--trusted-host", "pypi.org", "--trusted-host", "files.pythonhosted.org", *deps])
# PY

# 7) Copy source code
COPY ./app ./app

# 8) Run as non-root
RUN useradd -m appuser && chown -R appuser /app
USER appuser

# 9) Expose FastAPI port
EXPOSE 8000

# 10) Launch uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
