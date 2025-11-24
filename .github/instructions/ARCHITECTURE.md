---
description: 'Comprehensive architecture guide for Portfolio Builder project'
applyTo: '**/*'
---

# Portfolio Builder - Complete Architecture Guide

> **Version**: 2.0  
> **Last Updated**: October 2025 

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Patterns](#architecture-patterns)
4. [Data Flow](#data-flow)
5. [Security Architecture](#security-architecture)
6. [Testing Strategy](#testing-strategy)
7. [Deployment Architecture](#deployment-architecture)

---

## System Overview

### High-Level Architecture
```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Browser   │─────▶│   Nginx     │─────▶│  Postgres   │
│  (React 19) │      │  + FastAPI  │      │     15      │
└─────────────┘      └─────────────┘      └─────────────┘
     │                      │                      │
     │                      │                      │
   Vite Dev             Uvicorn              asyncpg
   Server               ASGI                 Driver
```

### Service Dependencies
```
db (Postgres) 
  ↓ (health check)
migrate (Alembic - runs once, exits)
  ↓ (completion check)
backend (FastAPI)
  ↓ (API calls)
frontend (React + Nginx)
```

---

## Technology Stack

### Backend Stack
| Component | Version | Purpose |
|-----------|---------|---------|
| **Python** | 3.11+ | Primary language |
| **FastAPI** | 0.115+ | ASGI web framework |
| **Pydantic** | v2 | Data validation & serialization |
| **SQLAlchemy** | 2.0 async | ORM with async support |
| **Alembic** | Latest | Database migrations |
| **PostgreSQL** | 15 | Primary database |
| **asyncpg** | Latest | Async Postgres driver |
| **Uvicorn** | Latest | ASGI server |
| **python-magic** | Latest | File type detection |
| **pypdf2** | Latest | PDF text extraction |
| **python-docx** | Latest | DOCX text extraction |
| **pytest** | Latest | Testing framework |
| **pytest-asyncio** | Latest | Async test support |

### Frontend Stack
| Component | Version | Purpose |
|-----------|---------|---------|
| **React** | 19 | UI library |
| **TypeScript** | 5.5+ | Type safety |
| **Vite** | 5+ | Build tool & dev server |
| **SCSS** | Latest | Styling (Tailwind removed) |
| **Zustand** | Latest | State management |
| **React Router** | Latest | Client-side routing |
| **React Hook Form** | Latest | Form management |
| **Axios** | Latest | HTTP client |
| **Vitest** | Latest | Unit testing |
| **React Testing Library** | Latest | Component testing |
| **Playwright** | Latest | E2E testing |

### Infrastructure
| Component | Version | Purpose |
|-----------|---------|---------|
| **Docker** | 20+ | Containerization |
| **Docker Compose** | 2.x | Multi-service orchestration |
| **Nginx** | Alpine | Frontend static file serving |

---

## Architecture Patterns

### Backend: Feature-Slice Architecture

Each feature follows a consistent structure under `backend/app/features/<feature>/`:

```
features/
  resumes/                     # Example: Resume management feature
    __init__.py               # Feature exports
    routes.py                 # FastAPI router configuration
    controller.py             # HTTP request/response handlers
    service.py                # Business logic (pure functions)
    schemas.py                # Pydantic request/response models
    security.py               # Feature-specific validation
    jsonb_models.py           # JSONB column data models (optional)
```

**Responsibility Layers:**

1. **Routes** (`routes.py`): API endpoint configuration
   - Defines URL paths, HTTP methods
   - Specifies OpenAPI metadata (responses, descriptions)
   - Wires dependencies (DB sessions, auth)

2. **Controller** (`controller.py`): Request/response handling
   - Validates incoming requests
   - Calls service layer functions
   - Transforms service results to API responses
   - Handles HTTP-specific errors

3. **Service** (`service.py`): Business logic
   - Pure functions (no HTTP concerns)
   - Orchestrates complex operations
   - Interacts with database, external services
   - Reusable across different endpoints

4. **Schemas** (`schemas.py`): Data contracts
   - Request validation models
   - Response serialization models
   - Inherits from base classes in `app/shared/schemas.py`

5. **Security** (`security.py`): Validation & sanitization
   - File type validation (MIME + magic bytes)
   - Size limits, malicious content checks
   - Input sanitization

### Frontend: Logic-View-Style Separation

Each component is split into three mandatory files:

```
Component/
  Component.tsx            # Logic: state, effects, handlers, data
  Component.view.tsx       # View: presentational JSX only
  Component.styles.scss    # Style: BEM classes with design tokens
  Component.types.ts       # TypeScript interfaces
  index.ts                 # Barrel exports (optional)
```

**Separation Rationale:**
- **Logic** (`Component.tsx`): Testable business logic without DOM
- **View** (`Component.view.tsx`): Visual structure, easy to modify
- **Style** (`Component.styles.scss`): Isolated styling with BEM

**Benefits:**
- Clear separation of concerns
- Easier code reviews (logic vs. presentation)
- Better testability (mock views easily)
- Reduced merge conflicts
- Faster onboarding

---

## Data Flow

### CV Upload Flow

```
1. User drops file → UploadArea.tsx
   ↓
2. Frontend validation (size, type) → fileValidation.ts
   ↓
3. POST /api/v1/resumes/upload → uploadService.ts
   ↓
4. Backend validation (MIME + magic bytes) → security.py
   ↓
5. Text extraction (PDF/DOCX) → adapters/{pdf,docx}/
   ↓
6. AI parsing → parsing/parser_core.py
   ↓
7. Data normalization → parsing/normalizers.py
   ↓
8. Pydantic validation → jsonb_models.py
   ↓
9. Database storage (JSONB) → models_resume.py
   ↓
10. Response with parsed data → schemas.py
```

### State Management Flow

**Frontend State:**
```
Zustand Store (resumeStore.ts)
  ↓
Component Logic (Component.tsx)
  ↓
Component View (Component.view.tsx)
  ↓
User Interaction
  ↓
Event Handler (Component.tsx)
  ↓
Update Store → Re-render
```

**Backend State:**
```
HTTP Request
  ↓
FastAPI Dependency (get_db)
  ↓
AsyncSession (per-request)
  ↓
SQLAlchemy Query
  ↓
Postgres Transaction
  ↓
Commit/Rollback
  ↓
Response
```

---

## Security Architecture

### Defense in Depth Layers

**Layer 1: Frontend Validation**
- Client-side file type checking
- Size limits (5MB)
- Extension whitelist (.pdf, .docx)
- User feedback before upload

**Layer 2: Backend Validation**
- MIME type verification
- Magic bytes inspection (first 8 bytes)
- Content-Type header validation
- File size streaming check

**Layer 3: Parsing Sandbox**
- No network access during parsing
- Separate worker process (future)
- Timeout limits
- Memory limits

**Layer 4: Data Validation**
- Pydantic strict mode
- JSONB schema validation
- SQL injection prevention (SQLAlchemy)
- XSS prevention (sanitization)

**Layer 5: Infrastructure**
- CORS policy (explicit origins)
- Security headers (CSP, X-Frame-Options)
- TLS in production
- Database least-privilege user

### File Upload Security

**Validation Pipeline:**
```python
1. Extension check → verify_extension()
2. MIME type check → content_type header
3. Magic bytes check → verify_magic_bytes()
4. Size check → streaming validation
5. Parse attempt → try/catch with sanitization
```

**Allowed Types:**
- `application/pdf` → Magic: `%PDF`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` → Magic: `PK\x03\x04`

### Auth Restore & Rate Limiting

- Normalize authentication failures to HTTP 401 (Unauthorized) for missing/invalid credentials. Configure `HTTPBearer(auto_error=False)` and raise explicit 401s inside the auth dependency so clients can reliably trigger refresh flows.
- Exempt critical auth routes from generic rate limiting to avoid breaking session restore on page load and during React Strict Mode double-mount in development:
   - `/api/v1/auth/me`
   - `/api/v1/auth/refresh`
   - `/api/v1/auth/login`
   - `/api/v1/auth/logout`
- Maintain general bypasses for non-API noise: `OPTIONS`, `HEAD`, `/favicon.ico`, `/robots.txt`, and `/.well-known/`.
- Frontend should deduplicate initial user fetch with an in-flight promise cache (e.g., `_fetchPromise`) and respect a `localStorage` sentinel (`auth:manualLogout`) to skip auto-restore after explicit logout.

---

## Testing Strategy

### Testing Pyramid

```
        /\
       /E2E\          ← Playwright (happy paths, critical flows)
      /------\
     /        \
    / Integr.  \      ← Pytest + AsyncClient (API contracts)
   /------------\
  /              \
 /  Unit Tests    \   ← Vitest + Pytest (logic, validation)
/------------------\
```

### Backend Testing

**Unit Tests** (`backend/app/tests/unit/`):
- Pure functions (parsing, normalization)
- Pydantic model validation
- Utility functions
- Isolated from DB

**Integration Tests** (`backend/app/tests/features/`):
- API endpoint testing with test DB
- Full request/response cycle
- Database transactions
- Error handling

**Example:**
```python
@pytest.mark.asyncio
async def test_upload_resume_success(client: AsyncClient, sample_pdf):
    files = {"file": ("resume.pdf", sample_pdf, "application/pdf")}
    response = await client.post("/api/v1/resumes/upload", files=files)
    
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "parsed"
    assert "id" in data
```

### Frontend Testing

**Unit Tests** (`frontend/src/tests/unit/`):
- Component logic functions
- Validation utilities
- State management stores
- Type transformations

**Component Tests** (`frontend/src/tests/unit/`):
- User interactions
- Conditional rendering
- Props handling
- Event handlers

**E2E Tests** (`frontend/tests/e2e/`):
- Complete user flows
- Multi-page navigation
- File upload integration
- Error scenarios

---

## Deployment Architecture

### Docker Compose Services

**Service: `db` (PostgreSQL)**
- Image: `postgres:15-alpine`
- Health check: `pg_isready` every 10s
- Persistent volume: `pgdata`
- Port: 5432 (configurable)

**Service: `migrate` (Alembic)**
- Build: `./backend`
- Runs once: `restart: "no"`
- Entrypoint: `/app/docker/migrate.sh`
- Depends on: `db` (healthy)
- Purpose: Apply schema migrations before backend starts

**Service: `backend` (FastAPI)**
- Build: `./backend`
- Command: `uvicorn app.main:app --host 0.0.0.0 --port 9000 --reload`
- Depends on: `db` (healthy) + `migrate` (completed)
- Volumes: Hot reload from `./backend/app`
- Port: 9000 (configurable)

**Service: `frontend` (React + Nginx)**
- Build: `./frontend`
- Multi-stage: Vite build → Nginx serve
- Port: 3000 (configurable)
- Environment: `VITE_API_BASE_URL=http://localhost:9000`

### Hot Reload Behavior

**Backend:**
- File changes in `backend/app/` → Uvicorn auto-reloads
- Dependency changes → Requires rebuild
- Migration changes → Run `docker compose up migrate`

**Frontend:**
- File changes in `frontend/src/` → Vite HMR
- Dependency changes → Requires rebuild
- Config changes (vite.config.ts) → Requires rebuild

---

## Migration Philosophy

### Safe Migration Principles

1. **Never run migrations in the application container**
   - Dedicated `migrate` service prevents race conditions
   - Backend only starts after successful migration

2. **Always review auto-generated migrations**
   - Alembic's `--autogenerate` is a starting point
   - Manually verify data migrations
   - Test rollback paths

3. **Make migrations reversible**
   - Implement `downgrade()` functions
   - Test rollback before deploying

4. **Separate schema and data migrations**
   - Schema: Add columns, tables, indexes
   - Data: Populate, transform, cleanup
   - Run in separate transactions

### Migration Commands

```bash
# Generate new migration
docker compose exec backend alembic revision --autogenerate -m "Add user_id to resumes"

# Apply migrations
docker compose up migrate

# Check current version
docker compose exec backend alembic current

# View history
docker compose exec backend alembic history

# Rollback one version
docker compose exec backend alembic downgrade -1
```

---

## Folder Structure Reference

```
portfolio-builder/
├── .github/
│   ├── copilot-instructions.md      # Main Copilot guide
│   └── instructions/
│       ├── ARCHITECTURE.md          # This file
│       ├── backend.instructions.md  # Backend patterns
│       ├── frontend.instructions.md # Frontend patterns
│       └── python.instructions.md   # Python conventions
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app entry
│   │   ├── api/v1/routes.py         # API version routing
│   │   ├── core/                    # Shared infrastructure
│   │   │   ├── config.py           # Environment config
│   │   │   ├── db.py               # Database setup
│   │   │   ├── errors.py           # Error handlers
│   │   │   ├── logging.py          # Logging config
│   │   │   └── security.py         # Security helpers
│   │   ├── db/                     # Database models
│   │   │   ├── base.py            # SQLAlchemy base
│   │   │   └── models_resume.py   # Resume model
│   │   ├── features/              # Feature slices
│   │   │   ├── adapters/         # External integrations
│   │   │   ├── parsing/          # CV parsing logic
│   │   │   └── resumes/          # Resume management
│   │   ├── shared/               # Shared utilities
│   │   │   ├── schemas.py       # Base Pydantic models
│   │   │   ├── enums.py         # Shared enumerations
│   │   │   └── types.py         # Custom types
│   │   ├── tests/               # Test suites
│   │   │   ├── unit/           # Unit tests
│   │   │   └── features/       # Integration tests
│   │   └── utils/              # Utility functions
│   ├── alembic/                # Migration files
│   ├── docker/                 # Docker scripts
│   ├── Dockerfile             # Backend image
│   └── pyproject.toml         # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── main.tsx          # React entry point
│   │   ├── App.tsx           # Root component
│   │   ├── features/         # Feature components
│   │   │   ├── UploadCV/    # CV upload feature
│   │   │   └── Preview/     # Portfolio preview
│   │   ├── services/        # API services
│   │   ├── store/           # Zustand stores
│   │   ├── styles/          # Global SCSS
│   │   │   ├── tokens/     # Design tokens
│   │   │   ├── mixins/     # SCSS mixins
│   │   │   ├── base/       # Reset & base styles
│   │   │   ├── layout/     # Layout primitives
│   │   │   ├── components/ # Shared components
│   │   │   └── utilities/  # Utility classes
│   │   ├── tests/          # Test suites
│   │   └── utils/          # Utility functions
│   ├── tests/e2e/          # Playwright E2E tests
│   ├── Dockerfile          # Frontend image
│   ├── vite.config.ts      # Vite configuration
│   └── package.json        # Node dependencies
├── docker-compose.yml      # Service orchestration
├── .env.example           # Environment template
├── README.md              # Setup guide
└── WORKFLOW_GUIDE.md      # Git workflow
```

---

## Key Design Decisions

### Why Feature-Slice Architecture?
- **Co-location**: Related code lives together
- **Scalability**: Easy to add features without affecting others
- **Clear boundaries**: Each feature is self-contained
- **Team collaboration**: Features can be developed in parallel

### Why Logic-View-Style Separation?
- **Testability**: Test logic without rendering
- **Maintainability**: Change UI without touching logic
- **Code reviews**: Review logic and UI separately
- **Performance**: Optimize rendering separately

### Why Pure SCSS (No Tailwind)?
- **Specificity control**: Avoid utility class conflicts
- **Design tokens**: Centralized theme management
- **BEM methodology**: Predictable class naming
- **Maintainability**: Clear component boundaries
- **Bundle size**: Only include used styles

### Why Async SQLAlchemy 2.0?
- **Performance**: Non-blocking I/O for database operations
- **Scalability**: Handle more concurrent requests
- **Modern Python**: Leverages async/await syntax
- **Type safety**: Better IDE support and error detection

### Why Dedicated Migration Service?
- **Safety**: Prevents race conditions during startup
- **Clarity**: Migration failures don't affect backend
- **Predictability**: Migrations always run first
- **Rollback safety**: Can restart backend without re-running migrations

---

## Performance Considerations

### Backend Optimization
- **Database connection pooling**: Reuse connections
- **Async everywhere**: Non-blocking I/O operations
- **JSONB indexing**: Fast queries on parsed data
- **Pagination**: Limit result set sizes
- **Caching** (future): Redis for frequent queries

### Frontend Optimization
- **Code splitting**: Route-based lazy loading
- **Tree shaking**: Remove unused code
- **SCSS optimization**: Only include used styles
- **Image optimization**: Compress assets
- **Vite build**: Optimized production builds

---

## Monitoring & Observability (Future)

### Planned Additions
- **Logging**: Structured JSON logs (ELK stack)
- **Metrics**: Prometheus + Grafana
- **Tracing**: OpenTelemetry for request tracing
- **Alerts**: PagerDuty for critical failures
- **Error tracking**: Sentry for exception reporting

---

## Contributing Guidelines

### Before Starting Work
1. Read this document + specific instruction files
2. Understand feature requirements
3. Check existing patterns in codebase
4. Discuss breaking changes with team

### During Development
1. Follow file structure conventions
2. Write tests alongside code
3. Use type hints/TypeScript everywhere
4. Commit frequently with conventional commits
5. Keep PRs small and focused

### Before Merging
1. Run all tests locally
2. Check linting (black, ruff, eslint)
3. Update documentation if needed
4. Request code review
5. Verify Docker build works

---

**Next Steps**: Read technology-specific instruction files:
- Backend: `.github/instructions/backend.instructions.md`
- Frontend: `.github/instructions/frontend.instructions.md`
- Python: `.github/instructions/python.instructions.md`
