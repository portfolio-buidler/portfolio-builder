---
description: 'Complete development guide with memory aids for Portfolio Builder architecture'
applyTo: '**/*'
---

# Portfolio Builder - Complete Development Guide

> **Version**: 2.0  
> **Purpose**: Quick reference for architecture, patterns, and conventions  
> **Last Updated**: October 2025

## 📋 Quick Navigation

- **Starting a Task?** → [Before You Code](#before-you-code-checklist)
- **Adding Backend Feature?** → [Backend Quick Reference](#backend-quick-reference)
- **Adding Frontend Component?** → [Frontend Quick Reference](#frontend-quick-reference)
- **Need Examples?** → [Code Patterns Library](#code-patterns-library)
- **Running Into Issues?** → [Common Problems & Solutions](#common-problems--solutions)

---

## Before You Code Checklist

### ✅ Pre-Development Steps
1. **Understand the requirement**
   - [ ] Read feature description
   - [ ] Identify affected layers (frontend/backend/database)
   - [ ] Check for existing similar features

2. **Check architecture patterns**
   - [ ] Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system overview
   - [ ] Review [backend.instructions.md](./backend.instructions.md) for backend patterns
   - [ ] Review [frontend.instructions.md](./frontend.instructions.md) for frontend patterns

3. **Plan your changes**
   - [ ] Database migration needed?
   - [ ] New API endpoint needed?
   - [ ] New frontend component needed?
   - [ ] Security implications?

4. **Setup your branch**
   - [ ] Follow naming: `<role>/<your-name>/<task>`
   - [ ] Pull latest from feature branch
   - [ ] Create your developer branch

---

## Backend Quick Reference

### File Structure Memory Aid
```
features/resumes/
  ├── routes.py       → "Where" (URL paths, HTTP methods)
  ├── controller.py   → "Handle" (request validation, error responses)
  ├── service.py      → "Do" (business logic, pure functions)
  ├── schemas.py      → "Shape" (request/response models)
  └── security.py     → "Guard" (validation, sanitization)
```

### Layer Responsibilities (Remember: "WHDS-G")
1. **W**here - Routes: Define endpoints
2. **H**andle - Controller: HTTP concerns
3. **D**o - Service: Business logic
4. **S**hape - Schemas: Data contracts
5. **G**uard - Security: Validation

### Common Backend Patterns

#### Pattern 1: Add New Endpoint
```python
# 1. routes.py - Define the route
@router.post("/items", response_model=ItemResponse, responses={...})
async def create_item_endpoint(item: ItemCreate, db: AsyncSession = Depends(get_db)):
    return await create_item(item, db)

# 2. controller.py - Handle HTTP
async def create_item(item: ItemCreate, db: AsyncSession) -> ItemResponse:
    result = await service_create_item(item, db)
    return ItemResponse.model_validate(result)

# 3. service.py - Business logic
async def service_create_item(item: ItemCreate, db: AsyncSession) -> Item:
    db_item = Item(**item.model_dump())
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item

# 4. schemas.py - Data models
class ItemCreate(APIModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None

class ItemResponse(IDModel, Timestamped):
    name: str
    description: str | None
```

#### Pattern 2: Database Query with Pagination
```python
from sqlalchemy import select, func

async def get_paginated_items(page: int, per_page: int, db: AsyncSession):
    # Count total
    count_stmt = select(func.count()).select_from(Item)
    total = await db.scalar(count_stmt) or 0
    
    # Fetch page
    offset = (page - 1) * per_page
    stmt = select(Item).order_by(Item.created_at.desc()).offset(offset).limit(per_page)
    result = await db.execute(stmt)
    items = result.scalars().all()
    
    return list(items), total
```

#### Pattern 3: File Upload with Validation
```python
# Security layer
async def validate_file(file: UploadFile) -> None:
    # 1. Extension check
    verify_extension(file.filename)
    # 2. MIME type check
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported type")
    # 3. Magic bytes check
    header = await file.read(8)
    await file.seek(0)
    verify_magic_bytes(header, file.content_type)
    # 4. Size check (streaming)
    await verify_file_size(file, MAX_SIZE)
    await file.seek(0)
```

### Pydantic v2 Cheat Sheet
```python
# ✅ DO (Pydantic v2)
from pydantic import field_validator, Field
class Model(APIModel):
    email: str
    
    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if "@" not in v:
            raise ValueError("Invalid email")
        return v.lower()

# ❌ DON'T (Pydantic v1 - deprecated)
# from pydantic import validator
# @validator("email")
# def validate_email(cls, v):
#     ...
```

### SQLAlchemy 2.0 Cheat Sheet
```python
# ✅ DO (SQLAlchemy 2.0 async)
from sqlalchemy import select
async with AsyncSessionLocal() as session:
    stmt = select(User).where(User.id == user_id)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

# ❌ DON'T (Old sync style)
# user = session.query(User).filter_by(id=user_id).first()
```

---

## Frontend Quick Reference

### Component Structure Memory Aid
```
Component/
  ├── Component.tsx        → "Think" (state, logic, handlers)
  ├── Component.view.tsx   → "Show" (JSX, presentation)
  ├── Component.styles.scss → "Style" (BEM, tokens)
  └── Component.types.ts   → "Define" (interfaces)
```

### Separation Principle (Remember: "TSS-D")
1. **T**hink - Logic file: State, effects, handlers
2. **S**how - View file: Presentational JSX
3. **S**tyle - SCSS file: BEM classes
4. **D**efine - Types file: TypeScript interfaces

### Common Frontend Patterns

#### Pattern 1: New Component with State
```typescript
// Component.types.ts
export interface ComponentProps {
  onSubmit?: (data: FormData) => void;
}

export interface ComponentViewProps {
  value: string;
  isLoading: boolean;
  error: string | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

// Component.tsx (Logic)
import { useState, useCallback } from 'react';
import { ComponentView } from './Component.view';
import { ComponentProps } from './Component.types';

export const Component: React.FC<ComponentProps> = ({ onSubmit }) => {
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
    setError(null);
  }, []);
  
  const handleSubmit = useCallback(async () => {
    if (!value.trim()) {
      setError('Value required');
      return;
    }
    
    setIsLoading(true);
    try {
      await onSubmit?.(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [value, onSubmit]);
  
  return (
    <ComponentView
      value={value}
      isLoading={isLoading}
      error={error}
      onChange={handleChange}
      onSubmit={handleSubmit}
    />
  );
};

// Component.view.tsx (View)
import { ComponentViewProps } from './Component.types';
import './Component.styles.scss';

export const ComponentView: React.FC<ComponentViewProps> = ({
  value,
  isLoading,
  error,
  onChange,
  onSubmit,
}) => (
  <div className="component" data-loading={isLoading}>
    <input
      type="text"
      className="component__input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={isLoading}
    />
    {error && <p className="component__error">{error}</p>}
    <button
      type="button"
      className="component__button"
      onClick={onSubmit}
      disabled={isLoading}
    >
      {isLoading ? 'Loading...' : 'Submit'}
    </button>
  </div>
);
```

#### Pattern 2: SCSS with Tokens & BEM
```scss
// Component.styles.scss
@use '../../../styles/tokens/colors' as colors;
@use '../../../styles/tokens/spacing' as spacing;
@use '../../../styles/tokens/radii' as radii;
@use '../../../styles/mixins/responsive' as responsive;

.component {
  padding: spacing.$md;
  border-radius: radii.$md;
  background-color: colors.$surface-primary;
  
  &[data-loading="true"] {
    opacity: 0.6;
    pointer-events: none;
  }
  
  &__input {
    width: 100%;
    padding: spacing.$sm spacing.$md;
    border: 1px solid colors.$border-default;
    border-radius: radii.$sm;
    
    &:focus {
      outline: none;
      border-color: colors.$primary;
      box-shadow: 0 0 0 3px colors.$primary-light;
    }
    
    &:disabled {
      background-color: colors.$surface-disabled;
      cursor: not-allowed;
    }
  }
  
  &__error {
    margin-top: spacing.$xs;
    color: colors.$error;
    font-size: 0.875rem;
  }
  
  &__button {
    margin-top: spacing.$md;
    padding: spacing.$sm spacing.$lg;
    background-color: colors.$primary;
    color: colors.$text-inverse;
    border: none;
    border-radius: radii.$md;
    cursor: pointer;
    transition: background-color 0.2s;
    
    &:hover:not(:disabled) {
      background-color: colors.$primary-dark;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  @include responsive.mq('tablet-down') {
    padding: spacing.$sm;
  }
}
```

#### Pattern 3: API Service
```typescript
// services/apiService.ts
import axios, { AxiosProgressEvent } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 30000,
});

// Intercept errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.detail || error.message || 'Unknown error';
    throw new Error(message);
  }
);

// Upload with progress
export const uploadFile = async (
  file: File,
  onProgress?: (percent: number) => void
) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/resumes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt: AxiosProgressEvent) => {
      if (evt.total) {
        const percent = Math.round((evt.loaded * 100) / evt.total);
        onProgress?.(percent);
      }
    },
  });
  
  return response.data;
};
```

### SCSS Import Rules (Critical!)
```scss
// ✅ DO - Relative paths
@use '../../../styles/tokens/colors' as colors;
@use '../../../styles/mixins/responsive' as responsive;

// ❌ DON'T - Absolute paths (Sass can't resolve)
// @use 'frontend/src/styles/tokens/colors' as colors;
// @use '@/styles/tokens/colors' as colors;
```

### BEM Naming Cheat Sheet
```scss
.block { }                    // Component root
.block__element { }           // Descendant part
.block--modifier { }          // Variant
.block__element--modifier { } // Element variant
.block[data-state="value"] { } // Dynamic state
```

---

## Code Patterns Library

### Pattern: Error Handling with HTTP Status Codes

**Backend (Controller)**:
```python
try:
    result = await service_function()
    return SuccessResponse(**result)
except ValueError as e:
    # Business logic error
    raise HTTPException(status_code=400, detail=str(e))
except PermissionError as e:
    # Authorization error
    raise HTTPException(status_code=403, detail=str(e))
except NotFoundError as e:
    # Resource not found
    raise HTTPException(status_code=404, detail=str(e))
except Exception as e:
    # Unexpected error - log and hide details
    logger.exception("Unexpected error")
    raise HTTPException(status_code=500, detail="Internal server error")
```

**Frontend (Service)**:
```typescript
try {
  const response = await api.post('/endpoint', data);
  return response.data;
} catch (error) {
  if (error instanceof Error) {
    throw new Error(error.message);
  }
  throw new Error('Unknown error occurred');
}
```

### Pattern: Database Transaction with Rollback

```python
async def complex_operation(data: Data, db: AsyncSession):
    try:
        # Multiple operations in transaction
        item1 = Item(**data.item1_data)
        db.add(item1)
        await db.flush()  # Get ID without committing
        
        item2 = RelatedItem(item_id=item1.id, **data.item2_data)
        db.add(item2)
        
        await db.commit()
        await db.refresh(item1)
        return item1
        
    except Exception as e:
        await db.rollback()
        raise ValueError(f"Transaction failed: {str(e)}")
```

### Pattern: Form Validation with React Hook Form

```typescript
import { useForm } from 'react-hook-form';

interface FormData {
  email: string;
  password: string;
}

export const LoginForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();
  
  const onSubmit = async (data: FormData) => {
    try {
      await loginService(data);
    } catch (error) {
      // Handle error
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('email', {
          required: 'Email is required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email address',
          },
        })}
      />
      {errors.email && <span>{errors.email.message}</span>}
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Log in'}
      </button>
    </form>
  );
};
```

---

## Common Problems & Solutions

### Backend Issues

#### Problem: "Pydantic validation error"
**Cause**: Using v1 syntax with v2
**Solution**:
```python
# ✅ Use @field_validator (v2)
@field_validator("email")
@classmethod
def validate_email(cls, v: str) -> str:
    return v

# ❌ Not @validator (v1)
```

#### Problem: "Database session closed"
**Cause**: Accessing relationship after session closed
**Solution**:
```python
# ✅ Load relationships within session
async with AsyncSessionLocal() as session:
    stmt = select(User).options(selectinload(User.posts))
    result = await session.execute(stmt)
    user = result.scalar_one()
    # Access user.posts here
    return user

# ❌ Don't access after session closes
```

#### Problem: "File type not validated"
**Cause**: Missing magic byte check
**Solution**: Always use layered validation (extension → MIME → magic bytes → size)

### Frontend Issues

#### Problem: "Sass can't resolve '@/styles'"
**Cause**: Using absolute path in SCSS
**Solution**:
```scss
// ✅ Use relative path
@use '../../../styles/tokens/colors' as colors;

// ❌ Don't use absolute
```

#### Problem: "Double refresh triggers 429 Too Many Requests"
**Cause**: React Strict Mode double-mount + auth interceptor retries + server-side rate limiting on auth endpoints.
**Solution**:
```ts
// Frontend: deduplicate bootstrap
// In auth store, keep a private _fetchPromise and return it if present
_fetchPromise: Promise<void> | null,
fetchUser: async () => { /* see frontend.instructions.md for full pattern */ },

// Respect a manual logout sentinel to skip auto-restore after explicit logout
localStorage.getItem('auth:manualLogout') === 'true'
```
```python
# Backend: exempt critical auth routes from rate limiter
# Bypass: /api/v1/auth/me, /api/v1/auth/refresh, /api/v1/auth/login, /api/v1/auth/logout
# Keep general bypasses for OPTIONS/HEAD/favicon/robots/.well-known/
```

#### Problem: "Production console is noisy"
**Cause**: Leftover success/info logs in components, stores, or services.
**Solution**: Remove `console.log` from production code; keep `console.error`/`console.warn` only for error reporting and prefer user-facing UI indicators (toasts/banners).

#### Problem: "Component re-renders too much"
**Cause**: Missing useCallback/useMemo
**Solution**:
```typescript
// ✅ Memoize callbacks
const handleClick = useCallback(() => {
  // logic
}, [dependencies]);

// ✅ Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return computeExpensive(data);
}, [data]);
```

#### Problem: "State not updating"
**Cause**: Mutating state directly
**Solution**:
```typescript
// ✅ Create new object/array
setItems(prev => [...prev, newItem]);
setUser(prev => ({ ...prev, name: newName }));

// ❌ Don't mutate
// items.push(newItem);
// user.name = newName;
```

### Docker Issues

#### Problem: "Migration failed"
**Cause**: Migration service not completing
**Solution**:
```bash
# Check migration logs
docker compose logs migrate

# Run migrations manually
docker compose up migrate

# Restart backend after fix
docker compose restart backend
```

#### Problem: "Hot reload not working"
**Cause**: Volume mount issue
**Solution**:
```bash
# Rebuild without cache
docker compose build --no-cache backend

# Restart services
docker compose restart backend
```

---

## Testing Checklist

### Backend Tests
- [ ] Unit tests for service functions
- [ ] Integration tests for API endpoints
- [ ] Test file upload validation
- [ ] Test error handling
- [ ] Test database transactions

### Frontend Tests
- [ ] Unit tests for utility functions
- [ ] Component tests for user interactions
- [ ] Test form validation
- [ ] Test error states
- [ ] E2E tests for critical flows

---

## Deployment Checklist

### Before Merging
- [ ] All tests passing
- [ ] Linting passing (black, ruff, eslint)
- [ ] Type checking passing (mypy, tsc)
- [ ] Docker build successful
- [ ] Code reviewed
- [ ] Documentation updated

### After Merging
- [ ] Migration applied (if needed)
- [ ] Environment variables updated (if needed)
- [ ] Services restarted
- [ ] Smoke tests passed

---

## Quick Command Reference

### Backend
```bash
# Format code
black backend/app/

# Lint
ruff check backend/app/

# Type check
mypy backend/app/

# Run tests
pytest backend/app/tests/

# Create migration
docker compose exec backend alembic revision --autogenerate -m "description"

# Apply migrations
docker compose up migrate
```

### Frontend
```bash
# Format code
npm run format

# Lint
npm run lint

# Type check
npm run type-check

# Run tests
npm test

# Run E2E tests
npm run e2e

# Build
npm run build
```

### Docker
```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Rebuild service
docker compose build --no-cache backend

# Restart service
docker compose restart backend

# Stop all
docker compose down
```

---

## Memory Aids

### Backend Layers (WHDS-G)
- **W**here → routes.py
- **H**andle → controller.py
- **D**o → service.py
- **S**hape → schemas.py
- **G**uard → security.py

### Frontend Files (TSS-D)
- **T**hink → Component.tsx
- **S**how → Component.view.tsx
- **S**tyle → Component.styles.scss
- **D**efine → Component.types.ts

### File Upload Validation (EMMS)
- **E**xtension check
- **M**IME type check
- **M**agic bytes check
- **S**ize check

### SCSS Imports (Never Absolute, Always Relative - "NAAR")
- **N**ever absolute paths
- **A**lways relative paths
- **A**s namespace alias
- **R**elative from component

---

**Need more details?** See:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Full system architecture
- [backend.instructions.md](./backend.instructions.md) - Backend patterns
- [frontend.instructions.md](./frontend.instructions.md) - Frontend patterns
- [python.instructions.md](./python.instructions.md) - Python conventions
