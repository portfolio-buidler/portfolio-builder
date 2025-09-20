# portfolio-builder
Portfolio Builder – Instantly turn your CV into a professional portfolio website.

## 🐳 Run with Docker Compose

The project ships with a multi-service `docker-compose.yml` (Postgres + Backend + Frontend) and a database‑only variant `docker-compose.db.yml`.

### 1. Create your `.env`

Copy the provided example file and adjust values (especially passwords if deploying anywhere public):

```powershell
Copy-Item .env.example .env
```

Key variables (defaults shown):

| Variable | Purpose |
|----------|---------|
| POSTGRES_USER / POSTGRES_PASSWORD | Database credentials |
| POSTGRES_DB | Database name |
| BACKEND_PORT | Host port for FastAPI (container always listens on 8000) |
| FRONTEND_PORT | Host port for the built frontend (container listens on 80) |
| DATABASE_URL | Async SQLAlchemy URL (must use `postgresql+asyncpg`) |
| ALEMBIC_DATABASE_URL | Optional sync URL for Alembic (fallbacks to `DATABASE_URL`) |
| ALLOWED_ORIGINS | CORS allowlist (comma separated) |
| MAX_UPLOAD_SIZE | Upload size limit in bytes |
| UPLOAD_DIR | Directory inside backend container for temp uploads |

### 2. Build & start everything

```powershell
docker compose up --build -d
```

This will:
1. Pull the Postgres image.
2. Build backend & frontend images.
3. Run database migrations automatically (see `backend/docker/entrypoint.sh`).

### 3. Verify services

```powershell
# Check container status
docker compose ps

# Follow backend logs
docker compose logs -f backend

# (Optional) Tail database logs
docker compose logs -f db
```

### 4. Access the app

- API root: http://localhost:${BACKEND_PORT:-8000}/
- Example health (root endpoint returns JSON)
- Frontend (served via nginx): http://localhost:${FRONTEND_PORT:-3000}/

### 5. Database-only mode

If you just need Postgres (e.g. for local dev with a host-run FastAPI):

```powershell
docker compose -f docker-compose.db.yml up -d
```

### 6. Apply migrations manually (optional)

Normally handled at container start, but you can run:

```powershell
docker compose exec backend alembic upgrade head
```

### 7. Execute an interactive shell inside the backend

```powershell
docker compose exec backend /bin/sh
```

### 8. Stop & clean up

```powershell
# Stop containers (preserves volumes)
docker compose down

# Remove everything including the Postgres volume
docker compose down -v
```

### 9. Common issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Backend container restarts quickly | Bad `DATABASE_URL` | Ensure it uses `postgresql+asyncpg://...@db:5432/...` |
| CORS errors in browser | Origin not in `ALLOWED_ORIGINS` | Add the dev URL to `.env` |
| Port already in use | Another process running on that port | Change `BACKEND_PORT` / `FRONTEND_PORT` in `.env` |

### 10. Rebuild after dependency changes

If you modify Python or Node dependencies:

```powershell
docker compose build backend
docker compose build frontend
```

Or force full rebuild:

```powershell
docker compose build --no-cache
```

---

Happy shipping! 🚀
