# Portfolio Builder

Transform your CV into a professional portfolio website with AI-powered parsing and generation.

## Features

- **CV Upload & Parsing**: Upload PDF/DOCX resumes and extract structured data using AI
- **Database Storage**: Store parsed CV data in PostgreSQL with JSONB format
- **REST API**: FastAPI backend with automatic OpenAPI documentation
- **React Frontend**: Modern UI for CV upload and portfolio generation
- **Auto Migrations**: Database schema updates handled automatically

## 🐳 Docker Setup

This project uses Docker Compose with four services:
- **PostgreSQL 15**: Database for storing parsed CV data
- **Migration Service**: Handles database schema updates safely
- **FastAPI Backend**: Python API server with CV parsing capabilities  
- **React Frontend**: User interface served via Nginx

### 1. Environment Configuration

Copy the example environment file:

```powershell
Copy-Item .env.example .env
```

Key environment variables:

| Variable | Purpose | Default |
|----------|---------|---------|
| `POSTGRES_USER` | Database username | `portfolio` |
| `POSTGRES_PASSWORD` | Database password | `portfolio_password` |
| `POSTGRES_DB` | Database name | `portfolio_db` |
| `BACKEND_PORT` | Host port for API access | `9000` |
| `FRONTEND_PORT` | Host port for web interface | `3000` |
| `DATABASE_URL` | SQLAlchemy connection string | Uses async driver |
| `ALLOWED_ORIGINS` | CORS origins for API | Frontend URL |
| `MAX_UPLOAD_SIZE` | CV file size limit (bytes) | `5242880` (5MB) |

### 2. Start the Application

Build and start all services:

```powershell
docker compose up --build -d
```

This process will:
1. **Pull PostgreSQL 15** image
2. **Build backend image** with FastAPI and CV parsing dependencies
3. **Build frontend image** with React and Nginx
4. **Run migration service** to apply database schema changes safely
5. **Start backend** only after migrations complete successfully
6. **Start all services** in detached mode

### 3. Verify Services

Check that all containers are running:

```powershell
docker compose ps
```

Expected output:
- `portfolio-builder-db-1` - PostgreSQL (healthy)
- `portfolio-builder-migrate-1` - Migration service (completed successfully)
- `portfolio-builder-backend-1` - FastAPI backend 
- `portfolio-builder-frontend-1` - React + Nginx frontend

Monitor backend startup and CV parsing logs:

```powershell
docker compose logs -f backend
```

Check database connectivity:

```powershell
docker compose logs -f db
```

### 4. Access the Application

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3000 | Upload CV and view portfolios |
| **API Documentation** | http://localhost:9000/docs | Interactive Swagger UI |
| **API Root** | http://localhost:9000 | Health check endpoint |

### 5. Test CV Upload

1. **Open Swagger UI**: http://localhost:9000/docs
2. **Navigate to**: `POST /resumes/upload`
3. **Upload a PDF/DOCX** resume file
4. **View parsed data** in the response

Verify data was stored in database:

```powershell
docker compose exec db psql -U portfolio -d portfolio_db -c "SELECT id, original_name, parse_status FROM resumes ORDER BY created_at DESC LIMIT 5;"
```

## 🔄 When to Rebuild Docker Images

### Backend Rebuild Required

Rebuild the backend image when you modify:

- **Python dependencies** in `backend/pyproject.toml`
- **System packages** in `backend/Dockerfile`
- **Alembic configuration** in `backend/alembic.ini`

```powershell
docker compose build backend
docker compose up -d backend
```

### Frontend Rebuild Required

Rebuild the frontend image when you modify:

- **Node.js dependencies** in `frontend/package.json`
- **Build configuration** (Vite, Tailwind, TypeScript configs)
- **Nginx configuration** in `frontend/Dockerfile`

```powershell
docker compose build frontend
docker compose up -d frontend
```

### Full Rebuild (All Services)

Force rebuild everything (useful after major changes):

```powershell
docker compose build --no-cache
docker compose up -d
```

### Code-Only Changes (No Rebuild Needed)

These changes are picked up automatically with hot reload:

- **Backend**: Python source code in `backend/app/`
- **Frontend**: React components and TypeScript files
- **Environment variables** (after container restart)

## 🗄️ Migration Management (Automatic & Safe)

### How Migrations Work

This project uses a **bulletproof migration system** that prevents common database issues:

1. **Dedicated Migration Service**: Runs `alembic upgrade head` once and exits
2. **Backend Dependency**: Only starts after migrations complete successfully  
3. **Fail-Fast**: If migrations fail, the backend won't start
4. **No Race Conditions**: Clean separation prevents migration conflicts

### Creating New Migrations

When you modify database models (like `models_resume.py`):

```powershell
# 1. Generate migration file
docker compose exec backend alembic revision --autogenerate -m "Add user profile fields"

# 2. Apply the migration
docker compose up migrate  # Runs once, exits cleanly

# 3. Restart backend to use new schema (optional)
docker compose restart backend
```

### Migration Best Practices

**✅ Safe Operations:**
- Adding new columns (nullable or with defaults)
- Adding new tables
- Adding indexes
- Renaming columns (with proper migration steps)

**⚠️ Potentially Breaking:**
- Dropping columns with data
- Changing column types
- Adding non-null columns without defaults

**🛡️ Recovery from Migration Issues:**
```powershell
# View migration history
docker compose exec backend alembic history

# Check current migration
docker compose exec backend alembic current

# Rollback one migration (if needed)
docker compose exec backend alembic downgrade -1
```

## 🔧 Development Workflow

### Database Operations

**View uploaded resumes:**
```powershell
docker compose exec db psql -U portfolio -d portfolio_db -c "SELECT id, original_name, parse_status, created_at FROM resumes ORDER BY created_at DESC;"
```

**Create new migration** (after model changes):
```powershell
docker compose exec backend alembic revision --autogenerate -m "Add new field to resume"
docker compose up migrate  # Run migration service
docker compose restart backend  # Restart backend to pick up changes
```

**Reset database** (development only):
```powershell
docker compose down -v  # Removes all data!
docker compose up -d
```

### Automatic Migration Benefits

**🎯 Zero-Downtime Deployments:**
- Migrations run before application starts
- Database schema always matches application expectations
- Failed migrations prevent broken application states

**🛡️ Developer Safety:**
- No manual migration commands needed for normal operation
- `docker compose up -d` handles everything automatically
- Consistent behavior across all environments

**🔄 Simple Development Cycle:**
1. Modify your models in `backend/app/db/`  
2. Generate migration: `docker compose exec backend alembic revision --autogenerate -m "Description"`
3. Restart: `docker compose restart backend` (auto-applies migration)
4. Test your changes!

### Database-Only Mode

Run only PostgreSQL for local development:

```powershell
docker compose -f docker-compose.db.yml up -d
```

Then connect your local backend to: `postgresql+asyncpg://portfolio:portfolio_password@localhost:5432/portfolio_db`

## 🛠️ Debugging & Troubleshooting

### Debug Backend Issues

**Access backend container shell:**
```powershell
docker compose exec backend /bin/sh
```

**View detailed backend logs:**
```powershell
docker compose logs backend --tail 50
```

**Check CV parsing errors:**
```powershell
docker compose logs backend | Select-String -Pattern "error|Error|ERROR"
```

### Debug Database Issues

**Connect to database directly:**
```powershell
docker compose exec db psql -U portfolio -d portfolio_db
```

**View database tables:**
```sql
\dt                    -- List all tables
\d resumes            -- Describe resumes table structure
```

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Backend container keeps restarting | Database connection failed | Check `DATABASE_URL` uses `@db:5432` (service name) |
| CV upload returns 201 but no data | Database transaction not committed | Fixed in latest code - restart backend |
| CORS errors in browser | Frontend origin not allowed | Add `http://localhost:3000` to `ALLOWED_ORIGINS` |
| Port already in use | Another service using same port | Change `BACKEND_PORT`/`FRONTEND_PORT` in `.env` |
| Large CV files rejected | File size exceeds limit | Increase `MAX_UPLOAD_SIZE` in `.env` |
| Migration service stuck | Migration conflicts (old issue) | **Fixed**: Now uses dedicated migration service |
| "Can't locate revision" error | Missing migration files | **Prevented**: Migrations run in isolated service |

### Why Migration Problems Are Solved

**Previous Issues (Now Fixed):**
- ❌ Backend and migration service conflicted
- ❌ Missing migration files caused restart loops  
- ❌ Race conditions between services

**Current Solution:**
- ✅ **Isolated migration service** runs once per deployment
- ✅ **Fail-fast design** prevents inconsistent states
- ✅ **Clean dependencies** ensure proper startup order
- ✅ **No restart loops** - backend starts only after successful migrations

## 🧹 Cleanup

**Stop services** (keeps data):
```powershell
docker compose down
```

**Remove everything** including database volume:
```powershell
docker compose down -v
```

**Remove unused Docker resources:**
```powershell
docker system prune -a
```

---

## 🚀 Quick Start Summary

1. `Copy-Item .env.example .env`
2. `docker compose up --build -d`
3. Open http://localhost:3000
4. Upload a CV via http://localhost:9000/docs

### 🛡️ Migration Problems = SOLVED

**TL;DR: You don't need to worry about migrations anymore!**

- ✅ **Automatic**: Migrations run every time you start the application
- ✅ **Safe**: Backend won't start if migrations fail  
- ✅ **Isolated**: Dedicated migration service prevents conflicts
- ✅ **Developer-Friendly**: Just code your models and restart - that's it!

**The only time you manually run migration commands:**
- Creating new migrations: `docker compose exec backend alembic revision --autogenerate -m "Description"`
- Everything else is automatic! 🎯

Happy building! 🎯

## 🧪 Testing

Run backend tests (inside running containers):

```powershell
docker compose exec backend python -m pytest -q
```

Included tests:
- `test_smoke.py` root endpoint sanity.
- `features/test_resumes.py` resume upload scenarios:
	- valid synthetic PDF (may return 201 or 422 depending on minimal PDF parsing).
	- unsupported MIME -> 415 fast-fail (no DB write).
	- empty/unreadable PDF -> mocked 422 path without DB interaction.

Design decisions improving testability:
- MIME validation and file parsing now occur BEFORE any database row creation.
- Database row is only created once parsing succeeds, simplifying error handling and avoiding noisy failed rows.
- Tests monkeypatch the service for deterministic error cases.

Add new tests under `backend/app/tests/` and run the same command.
