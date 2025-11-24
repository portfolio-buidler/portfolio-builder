---
description: 'Backend development standards for FastAPI, Pydantic v2, SQLAlchemy 2.0, and PostgreSQL'
applyTo: '**/backend/**/*.py, **/alembic/**/*.py, **/tests/**/*.py'
---

# Backend Development Instructions (FastAPI + Python)

> **Version**: 4.0  
> **Last Updated**: November 2025  
> **Maintainer**: Backend Team (Israel, Ido, Yarin)  
> **Prerequisites**: Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system overview

---

## 🚨 Mandatory Reading Protocol

**Before implementing any backend code, you MUST:**

1. **Read this file completely** - Understand all patterns
2. **Reference [ARCHITECTURE.md](./ARCHITECTURE.md)** - Understand feature-slice architecture
3. **Check [python.instructions.md](./python.instructions.md)** - General Python conventions
4. **Study existing code** - Review `backend/app/features/resumes/` as canonical example

---

## 📚 Table of Contents

1. [Stack Overview](#stack-overview)
2. [Feature-Slice Architecture](#feature-slice-architecture-whds-g)
3. [Layer Responsibilities](#layer-responsibilities)
4. [Pydantic v2 Patterns](#pydantic-v2-patterns)
5. [SQLAlchemy 2.0 Async](#sqlalchemy-20-async-patterns)
6. [Security Validation](#security-validation-patterns)
7. [Error Handling](#error-handling-patterns)
8. [Testing Patterns](#testing-patterns)
9. [Alembic Migrations](#alembic-migration-patterns)
10. [Common Pitfalls](#common-pitfalls--solutions)
11. [Code Quality Checklist](#code-quality-checklist)

---

## Stack Overview

### Core Technologies

| Component | Version | Purpose | Documentation |
|-----------|---------|---------|---------------|
| **FastAPI** | 0.115+ | Async web framework | Automatic OpenAPI, dependency injection |
| **Pydantic** | v2 (2.0+) | Data validation | Type-safe models, JSON schema |
| **SQLAlchemy** | 2.0+ | Async ORM | Modern async query API |
| **Alembic** | 1.13+ | DB migrations | Version-controlled schema changes |
| **PostgreSQL** | 15 | Primary database | JSONB support for semi-structured data |
| **asyncpg** | 0.29+ | Async driver | High-performance Postgres connection |
| **Uvicorn** | 0.30+ | ASGI server | Production-ready async server |
| **Pytest** | 8.0+ | Testing framework | Async support via pytest-asyncio |

### Project Dependencies

```toml
# pyproject.toml (excerpt)
[project]
dependencies = [
    "fastapi>=0.115.0",
    "pydantic>=2.0.0",
    "pydantic-settings>=2.0.0",
    "sqlalchemy>=2.0.0",
    "alembic>=1.13.0",
    "asyncpg>=0.29.0",
    "uvicorn[standard]>=0.30.0",
    "python-multipart>=0.0.9",  # File upload support
    "python-magic>=0.4.27",     # MIME type detection
    "pypdf2>=3.0.0",            # PDF text extraction
    "python-docx>=1.1.0",       # DOCX text extraction
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.23.0",
    "pytest-cov>=5.0.0",
    "httpx>=0.27.0",           # Async HTTP client for tests
    "black>=24.0.0",           # Code formatter
    "ruff>=0.5.0",             # Fast linter
    "mypy>=1.11.0",            # Static type checker
    "bandit>=1.7.0",           # Security linter
]
```

---

## Feature-Slice Architecture (WHDS-G)

### Directory Structure (Mandatory)

Every feature MUST follow this exact structure under `backend/app/features/<feature_name>/`:

```
features/
  <feature_name>/             # e.g., "resumes", "portfolios", "templates"
    __init__.py              # Feature module exports
    routes.py                # (W) Where: FastAPI router configuration
    controller.py            # (H) Handle: HTTP request/response handlers
    service.py               # (D) Do: Business logic (pure functions)
    schemas.py               # (S) Shape: Pydantic request/response models
    security.py              # (G) Guard: Feature-specific validation
    jsonb_models.py          # Optional: JSONB column data models
```

### Memory Aid: WHDS-G

Remember the layer responsibilities with this acronym:

- **W**here → `routes.py` - Define URL paths and HTTP methods
- **H**andle → `controller.py` - Handle HTTP concerns (validation, errors)
- **D**o → `service.py` - Do business logic (pure, testable functions)
- **S**hape → `schemas.py` - Shape data contracts (Pydantic models)
- **G**uard → `security.py` - Guard against invalid/malicious input

**Cross-Reference**: See [ARCHITECTURE.md § Feature-Slice Architecture](./ARCHITECTURE.md#backend-feature-slice-architecture) for architectural rationale.

---

## Layer Responsibilities

### Layer 1: Routes (`routes.py`) - API Endpoint Configuration

**Purpose**: Define the API surface with OpenAPI metadata

**Responsibilities**:
- ✅ Define URL paths and HTTP methods
- ✅ Specify request/response models
- ✅ Configure OpenAPI metadata (summary, description, responses)
- ✅ Wire dependencies (database session, auth)
- ❌ NO business logic
- ❌ NO database queries
- ❌ NO validation (beyond request model)

**Complete Pattern**:

```python
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from .controller import (
    upload_resume,
    get_resume,
    list_resumes,
    update_resume,
    delete_resume,
)
from .schemas import (
    ResumeUploadResponse,
    ResumeDetailResponse,
    ResumeListResponse,
    ResumeUpdate,
)

# Create router with prefix and tags for OpenAPI grouping
router = APIRouter(
    prefix="/resumes",
    tags=["resumes"],
    responses={
        401: {"description": "Unauthorized"},
        500: {"description": "Internal server error"},
    }
)


@router.post(
    "/upload",
    response_model=ResumeUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and parse a CV",
    description=(
        "Upload a CV file (PDF or DOCX) and extract structured data using AI parsing. "
        "The file is validated for type and size, then parsed into structured JSON."
    ),
    responses={
        201: {
            "description": "Resume uploaded and parsed successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": 1,
                        "status": "parsed",
                        "message": "Resume uploaded and parsed successfully",
                        "parsed_data": {
                            "contact": {"name": "John Doe", "email": "john@example.com"},
                            "experience": [],
                            "education": [],
                            "skills": []
                        }
                    }
                }
            }
        },
        400: {"description": "Invalid file format or validation error"},
        413: {"description": "File too large (max 5MB)"},
        415: {"description": "Unsupported file type (only PDF/DOCX allowed)"},
        422: {"description": "Unable to parse document content"},
    }
)
async def upload_resume_endpoint(
    file: UploadFile,
    db: AsyncSession = Depends(get_db)
) -> ResumeUploadResponse:
    """
    Upload and parse a CV (PDF/DOCX) into structured JSON.
    
    Process flow:
    1. Validates file type (PDF/DOCX) and size (<5MB)
    2. Extracts text content from document
    3. Parses into structured data (contact, experience, education, skills)
    4. Stores in database with JSONB column
    5. Returns resume ID and parsed data
    
    Security: File validated with MIME type + magic bytes + size check
    """
    return await upload_resume(file, db)


@router.get(
    "/{resume_id}",
    response_model=ResumeDetailResponse,
    summary="Get resume by ID",
    description="Retrieve a single resume with all parsed data and metadata.",
    responses={
        200: {"description": "Resume found"},
        404: {"description": "Resume not found"},
    }
)
async def get_resume_endpoint(
    resume_id: int,
    db: AsyncSession = Depends(get_db)
) -> ResumeDetailResponse:
    """Retrieve a single resume with parsed data."""
    return await get_resume(resume_id, db)


@router.get(
    "/",
    response_model=ResumeListResponse,
    summary="List all resumes",
    description="Paginated list of all uploaded resumes with metadata (excluding full parsed data).",
    responses={
        200: {"description": "Resumes retrieved successfully"},
        400: {"description": "Invalid pagination parameters"},
    }
)
async def list_resumes_endpoint(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    db: AsyncSession = Depends(get_db)
) -> ResumeListResponse:
    """
    List all resumes with pagination.
    
    Returns metadata only (file_name, upload_date, status).
    Use GET /{resume_id} to retrieve full parsed data.
    """
    return await list_resumes(page, per_page, db)
```

**Key Points**:
- Always use `APIRouter` with prefix and tags
- Include comprehensive `responses=` dict with examples
- Use `Depends(get_db)` for database session injection
- Type all parameters and return values
- Use `Query()` for query parameter validation
- Add detailed docstrings (shown in OpenAPI)

---

### Layer 2: Controller (`controller.py`) - Request/Response Handling

**Purpose**: Bridge between HTTP world and business logic

**Responsibilities**:
- ✅ Call security validation functions
- ✅ Delegate to service layer
- ✅ Transform service results to API responses
- ✅ Handle errors with appropriate HTTP status codes
- ✅ Log errors before raising
- ❌ NO business logic (belongs in service layer)
- ❌ NO direct database access (use service layer)

**Complete Pattern**:

```python
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from .service import (
    process_resume_upload,
    fetch_resume_by_id,
    fetch_all_resumes,
    update_resume_data,
    remove_resume,
)
from .schemas import (
    ResumeUploadResponse,
    ResumeDetailResponse,
    ResumeListResponse,
    ResumeUpdate,
)
from .security import validate_upload_file

logger = logging.getLogger(__name__)


async def upload_resume(
    file: UploadFile,
    db: AsyncSession
) -> ResumeUploadResponse:
    """
    Handle resume upload request.
    
    Responsibilities:
    1. Validate file (security layer)
    2. Delegate to service layer
    3. Transform service result to API response
    4. Handle errors with appropriate HTTP status codes
    
    Args:
        file: Uploaded file from request
        db: Database session
    
    Returns:
        ResumeUploadResponse with created resume ID and parsed data
    
    Raises:
        HTTPException: 400 (validation), 413 (size), 415 (type), 422 (parsing)
    """
    # Layer 1: Security validation (raises HTTPException on failure)
    await validate_upload_file(file)
    
    # Layer 2: Business logic in service layer
    try:
        result = await process_resume_upload(file, db)
        
        # Layer 3: Transform to API response
        return ResumeUploadResponse(
            id=result.id,
            status="parsed",
            message="Resume uploaded and parsed successfully",
            parsed_data=result.parsed_data,
            file_name=result.file_name,
            uploaded_at=result.created_at,
        )
    
    except ValueError as e:
        # Business logic errors → 400 Bad Request
        logger.warning("Resume validation failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    except Exception as e:
        # Unexpected errors → 500 Internal Server Error
        logger.exception("Unexpected error during resume upload")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing the resume"
        )


async def get_resume(
    resume_id: int,
    db: AsyncSession
) -> ResumeDetailResponse:
    """
    Handle get resume by ID request.
    
    Args:
        resume_id: Resume database ID
        db: Database session
    
    Returns:
        ResumeDetailResponse with full resume data
    
    Raises:
        HTTPException: 404 if resume not found
    """
    result = await fetch_resume_by_id(resume_id, db)
    
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resume with ID {resume_id} not found"
        )
    
    return ResumeDetailResponse.model_validate(result)


async def list_resumes(
    page: int,
    per_page: int,
    db: AsyncSession
) -> ResumeListResponse:
    """
    Handle list resumes request.
    
    Args:
        page: Page number (1-indexed)
        per_page: Items per page
        db: Database session
    
    Returns:
        ResumeListResponse with paginated resume list
    """
    resumes, total_count = await fetch_all_resumes(page, per_page, db)
    
    return ResumeListResponse(
        resumes=[ResumeDetailResponse.model_validate(r) for r in resumes],
        total=total_count,
        page=page,
        per_page=per_page,
        pages=(total_count + per_page - 1) // per_page,
    )
```

**Key Points**:
- Always call security validation before service layer
- Use try-except for error handling with specific HTTP status codes
- Log errors before raising HTTPException
- Transform service layer results to response models
- Never catch generic Exception without logging
- Use `model_validate()` to convert SQLAlchemy models to Pydantic

---

### Layer 3: Service (`service.py`) - Business Logic

**Purpose**: Implement business logic as pure, testable functions

**Responsibilities**:
- ✅ Implement business logic (pure functions when possible)
- ✅ Coordinate database operations
- ✅ Orchestrate complex workflows
- ✅ Validate business rules
- ✅ Interact with external services
- ❌ NO HTTP concerns (HTTPException, status codes)
- ❌ NO request/response models (use domain models)

**Complete Pattern**:

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import UploadFile
import logging

from app.db.models_resume import Resume
from app.features.adapters.pdf import extract_text_from_pdf
from app.features.adapters.docx import extract_text_from_docx
from app.features.parsing.parser_core import parse_resume_text
from app.features.parsing.normalizers import normalize_parsed_data
from .jsonb_models import ResumeParsed

logger = logging.getLogger(__name__)


async def process_resume_upload(
    file: UploadFile,
    db: AsyncSession
) -> Resume:
    """
    Process uploaded resume file.
    
    Workflow:
    1. Read file content
    2. Extract text based on file type
    3. Parse text into structured data
    4. Normalize and validate parsed data
    5. Store in database
    
    Args:
        file: Uploaded file (already validated)
        db: Database session
    
    Returns:
        Resume database model with parsed data
    
    Raises:
        ValueError: If text extraction or parsing fails
    """
    # Step 1: Read file content
    content = await file.read()
    file_name = file.filename or "unknown.pdf"
    content_type = file.content_type or "application/pdf"
    
    # Step 2: Extract text based on file type
    try:
        if content_type == "application/pdf":
            raw_text = await extract_text_from_pdf(content)
        elif content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            raw_text = await extract_text_from_docx(content)
        else:
            raise ValueError(f"Unsupported file type: {content_type}")
    except Exception as e:
        logger.error("Text extraction failed for %s: %s", file_name, e)
        raise ValueError(f"Failed to extract text from document: {str(e)}")
    
    # Step 3: Parse text into structured data
    try:
        parsed_dict = await parse_resume_text(raw_text)
    except Exception as e:
        logger.error("Parsing failed for %s: %s", file_name, e)
        raise ValueError(f"Failed to parse resume content: {str(e)}")
    
    # Step 4: Normalize and validate with Pydantic
    try:
        parsed_data = ResumeParsed(**normalize_parsed_data(parsed_dict))
    except Exception as e:
        logger.error("Validation failed for %s: %s", file_name, e)
        raise ValueError(f"Parsed data validation failed: {str(e)}")
    
    # Step 5: Store in database
    resume = Resume(
        file_name=file_name,
        content_type=content_type,
        file_size=len(content),
        raw_text=raw_text,
        parsed_data=parsed_data.model_dump(),  # Convert to dict for JSONB
        status="parsed",
    )
    
    db.add(resume)
    await db.commit()
    await db.refresh(resume)
    
    logger.info("Resume processed successfully: ID=%d, file=%s", resume.id, file_name)
    return resume


async def fetch_resume_by_id(
    resume_id: int,
    db: AsyncSession
) -> Resume | None:
    """
    Fetch resume by ID.
    
    Args:
        resume_id: Resume database ID
        db: Database session
    
    Returns:
        Resume model or None if not found
    """
    stmt = select(Resume).where(Resume.id == resume_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def fetch_all_resumes(
    page: int,
    per_page: int,
    db: AsyncSession
) -> tuple[list[Resume], int]:
    """
    Fetch paginated list of resumes.
    
    Args:
        page: Page number (1-indexed)
        per_page: Items per page
        db: Database session
    
    Returns:
        Tuple of (resume_list, total_count)
    """
    # Count total resumes
    count_stmt = select(func.count()).select_from(Resume)
    total_count = await db.scalar(count_stmt) or 0
    
    # Fetch page
    offset = (page - 1) * per_page
    stmt = (
        select(Resume)
        .order_by(Resume.created_at.desc())
        .offset(offset)
        .limit(per_page)
    )
    result = await db.execute(stmt)
    resumes = list(result.scalars().all())
    
    return resumes, total_count


async def update_resume_data(
    resume_id: int,
    update_data: dict,
    db: AsyncSession
) -> Resume | None:
    """
    Update resume parsed data.
    
    Args:
        resume_id: Resume database ID
        update_data: Updated parsed data (validated by Pydantic)
        db: Database session
    
    Returns:
        Updated resume or None if not found
    """
    resume = await fetch_resume_by_id(resume_id, db)
    if resume is None:
        return None
    
    # Update parsed_data field
    resume.parsed_data = update_data
    resume.status = "edited"
    
    await db.commit()
    await db.refresh(resume)
    
    logger.info("Resume updated: ID=%d", resume_id)
    return resume


async def remove_resume(
    resume_id: int,
    db: AsyncSession
) -> bool:
    """
    Delete resume by ID.
    
    Args:
        resume_id: Resume database ID
        db: Database session
    
    Returns:
        True if deleted, False if not found
    """
    resume = await fetch_resume_by_id(resume_id, db)
    if resume is None:
        return False
    
    await db.delete(resume)
    await db.commit()
    
    logger.info("Resume deleted: ID=%d", resume_id)
    return True
```

**Key Points**:
- Pure functions when possible (no side effects beyond database)
- No HTTP concerns (raise ValueError, not HTTPException)
- Comprehensive logging at info/error levels
- Clear workflow documentation in docstrings
- Return domain models (SQLAlchemy), not Pydantic response models
- Use transactions appropriately (commit/rollback)

---

### Layer 4: Schemas (`schemas.py`) - Data Contracts

**Purpose**: Define request and response models with validation

**Responsibilities**:
- ✅ Define Pydantic models for requests and responses
- ✅ Inherit from base classes (`APIModel`, `IDModel`, `Timestamped`)
- ✅ Use field validators for custom validation
- ✅ Use field serializers for custom formatting
- ✅ Document fields with descriptions
- ❌ NO business logic
- ❌ NO database queries

**Complete Pattern**:

```python
from pydantic import Field, field_validator, field_serializer
from datetime import datetime
from typing import Any

from app.shared.schemas import APIModel, IDModel, Timestamped


# Base model with shared config
# (inherits ConfigDict from APIModel in app/shared/schemas.py)


# Request Models

class ResumeUploadResponse(IDModel):
    """Response after uploading a resume."""
    status: str = Field(..., description="Processing status (parsed, failed)")
    message: str = Field(..., description="Human-readable status message")
    parsed_data: dict[str, Any] | None = Field(None, description="Parsed resume data (if successful)")
    file_name: str = Field(..., description="Original file name")
    uploaded_at: datetime = Field(..., description="Upload timestamp")


class ResumeUpdate(APIModel):
    """Request to update resume parsed data."""
    contact: dict[str, Any] | None = Field(None, description="Updated contact information")
    experience: list[dict[str, Any]] | None = Field(None, description="Updated work experience")
    education: list[dict[str, Any]] | None = Field(None, description="Updated education")
    skills: list[str] | None = Field(None, description="Updated skills list")
    
    @field_validator("contact")
    @classmethod
    def validate_contact(cls, v: dict[str, Any] | None) -> dict[str, Any] | None:
        """Validate contact information structure."""
        if v is not None:
            required_fields = {"name", "email"}
            if not all(field in v for field in required_fields):
                raise ValueError(f"Contact must include: {', '.join(required_fields)}")
        return v


# Response Models

class ResumeDetailResponse(IDModel, Timestamped):
    """Response with full resume details."""
    file_name: str = Field(..., description="Original file name")
    content_type: str = Field(..., description="MIME type (application/pdf or application/vnd...)")
    file_size: int = Field(..., description="File size in bytes")
    status: str = Field(..., description="Processing status (parsed, failed, edited)")
    parsed_data: dict[str, Any] = Field(..., description="Structured resume data (JSONB)")
    raw_text: str | None = Field(None, description="Extracted raw text (optional)")
    
    @field_serializer("file_size")
    def serialize_file_size(self, value: int) -> str:
        """Format file size as human-readable string."""
        if value < 1024:
            return f"{value} B"
        elif value < 1024 ** 2:
            return f"{value / 1024:.1f} KB"
        else:
            return f"{value / (1024 ** 2):.1f} MB"


class ResumeListItem(IDModel):
    """Resume metadata for list view (no parsed_data for performance)."""
    file_name: str
    status: str
    uploaded_at: datetime = Field(..., alias="created_at")


class ResumeListResponse(APIModel):
    """Paginated list of resumes."""
    resumes: list[ResumeListItem] = Field(..., description="Resume metadata list")
    total: int = Field(..., description="Total number of resumes")
    page: int = Field(..., description="Current page number (1-indexed)")
    per_page: int = Field(..., description="Items per page")
    pages: int = Field(..., description="Total number of pages")
```

**Key Points**:
- Inherit from `APIModel` (base class with shared config)
- Inherit from `IDModel` for models with `id: int`
- Inherit from `Timestamped` for models with `created_at`, `updated_at`
- Use `Field(..., description=...)` for all fields (shows in OpenAPI)
- Use `@field_validator` for custom validation (Pydantic v2)
- Use `@field_serializer` for custom formatting
- Split into request models and response models
- Use type hints everywhere (`dict[str, Any]`, `list[str]`, etc.)

**Cross-Reference**: See [python.instructions.md § Pydantic v2](./python.instructions.md#pydantic-v2-models) for more Pydantic patterns.

---

### Layer 5: Security (`security.py`) - Validation & Sanitization

**Purpose**: Validate and sanitize inputs to prevent security vulnerabilities

**Responsibilities**:
- ✅ File type validation (extension + MIME + magic bytes)
- ✅ File size validation (streaming)
- ✅ Input sanitization
- ✅ Malicious content detection
- ❌ NO business logic
- ❌ NO database queries

**Complete Pattern (EMMS - Extension, MIME, Magic, Size)**:

```python
from fastapi import UploadFile, HTTPException, status
import magic
import logging

logger = logging.getLogger(__name__)

# Configuration
MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MAGIC_BYTES = {
    "application/pdf": b"%PDF",  # PDF magic bytes
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": b"PK\x03\x04",  # ZIP-based (DOCX)
}


async def validate_upload_file(file: UploadFile) -> None:
    """
    Validate uploaded file using layered security (EMMS pattern).
    
    Validation layers:
    1. Extension check (filename)
    2. MIME type check (Content-Type header)
    3. Magic bytes check (file header inspection)
    4. Size check (streaming validation)
    
    Args:
        file: Uploaded file object
    
    Raises:
        HTTPException: 415 (type), 413 (size), 400 (general validation)
    """
    # Layer 1: Extension check
    verify_file_extension(file.filename)
    
    # Layer 2: MIME type check
    if file.content_type not in ALLOWED_MIME_TYPES:
        logger.warning(
            "Invalid MIME type: %s for file: %s",
            file.content_type,
            file.filename
        )
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type. Allowed: PDF, DOCX"
        )
    
    # Layer 3: Magic bytes check
    header = await file.read(8)
    await file.seek(0)  # Reset file pointer
    verify_magic_bytes(header, file.content_type)
    
    # Layer 4: Size check (streaming)
    await verify_file_size(file)
    await file.seek(0)  # Reset file pointer for further processing
    
    logger.info("File validated successfully: %s (%s)", file.filename, file.content_type)


def verify_file_extension(filename: str | None) -> None:
    """
    Verify file extension is in whitelist.
    
    Args:
        filename: File name with extension
    
    Raises:
        HTTPException: 415 if extension not allowed
    """
    if not filename:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="File name is required"
        )
    
    extension = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File extension '{extension}' not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )


def verify_magic_bytes(header: bytes, content_type: str) -> None:
    """
    Verify file magic bytes match declared MIME type.
    
    Args:
        header: First 8 bytes of file
        content_type: Declared MIME type
    
    Raises:
        HTTPException: 400 if magic bytes don't match
    """
    expected_bytes = MAGIC_BYTES.get(content_type)
    
    if expected_bytes and not header.startswith(expected_bytes):
        logger.warning(
            "Magic bytes mismatch: expected %s, got %s for type %s",
            expected_bytes.hex(),
            header[:8].hex(),
            content_type
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content does not match declared type"
        )


async def verify_file_size(file: UploadFile) -> None:
    """
    Verify file size does not exceed maximum (streaming validation).
    
    Args:
        file: Uploaded file object
    
    Raises:
        HTTPException: 413 if file too large
    """
    size = 0
    chunk_size = 1024 * 1024  # 1 MB chunks
    
    while chunk := await file.read(chunk_size):
        size += len(chunk)
        if size > MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Maximum size: {MAX_UPLOAD_SIZE / (1024 * 1024):.1f} MB"
            )
    
    await file.seek(0)  # Reset for further processing
    logger.debug("File size validated: %d bytes", size)
```

**Memory Aid: EMMS**
- **E**xtension check (whitelist)
- **M**IME type check (Content-Type header)
- **M**agic bytes check (file header)
- **S**ize check (streaming)

**Key Points**:
- Always validate in layers (defense in depth)
- Use streaming validation for size to prevent memory exhaustion
- Reset file pointer (`seek(0)`) after reading
- Log all validation failures for security monitoring
- Use specific HTTP status codes (415 for type, 413 for size)

---

### Complete EMMS Implementation (Sprint Task #1)

The EMMS pattern provides **defense-in-depth** file upload security. Each layer catches different attack vectors:

#### Layer 1: Extension Validation

**Purpose**: Block obviously malicious files and double extensions

```python
import re
from pathlib import Path

ALLOWED_EXTENSIONS = {".pdf", ".docx"}

def verify_extension(filename: str) -> tuple[bool, str, str | None]:
    """
    Verify file extension against whitelist.
    
    Returns: (is_valid, extension, error_message)
    
    Security checks:
    - Whitelist validation (only .pdf, .docx)
    - Double extension detection (.php.pdf)
    - Case-insensitive matching
    
    Examples:
        verify_extension("resume.pdf")        # (True, ".pdf", None)
        verify_extension("resume.PDF")        # (True, ".pdf", None)
        verify_extension("malicious.php.pdf") # (False, "", "Double extensions not allowed")
        verify_extension("resume.exe")        # (False, ".exe", "File type not allowed")
    """
    filename_lower = filename.lower()
    
    # Check for double extensions (e.g., .php.pdf, .exe.docx)
    # Count dots excluding the last extension
    parts = filename_lower.split('.')
    if len(parts) > 2:
        # Check if any middle part looks like an extension
        suspicious_parts = parts[1:-1]  # Everything between first and last dot
        for part in suspicious_parts:
            if part in ['php', 'exe', 'js', 'py', 'sh', 'bat', 'com', 'cmd']:
                return False, "", "Double extensions not allowed"
    
    # Extract and validate extension
    extension = Path(filename_lower).suffix
    
    if not extension:
        return False, "", "File must have an extension"
    
    if extension not in ALLOWED_EXTENSIONS:
        return False, extension, f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
    
    return True, extension, None
```

#### Layer 2: MIME Type Verification

**Purpose**: Validate Content-Type header

```python
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}

def verify_mime_type(file: UploadFile) -> tuple[bool, str, str | None]:
    """
    Verify MIME type from Content-Type header.
    
    Returns: (is_valid, mime_type, error_message)
    
    Security: Validates Content-Type header sent by client
    Note: Can be spoofed, so combine with magic bytes check
    """
    mime_type = file.content_type
    
    if not mime_type:
        return False, "", "Missing Content-Type header"
    
    if mime_type not in ALLOWED_MIME_TYPES:
        return False, mime_type, f"MIME type not allowed: {mime_type}"
    
    return True, mime_type, None
```

#### Layer 3: Magic Bytes Inspection

**Purpose**: Verify actual file content (cannot be spoofed)

```python
MAGIC_BYTES = {
    "pdf": b"%PDF",
    "docx": b"PK\x03\x04",  # ZIP signature (DOCX is a ZIP file)
}

async def verify_magic_bytes(file: UploadFile, expected_ext: str) -> tuple[bool, str | None]:
    """
    Verify file signature (magic bytes) matches expected type.
    
    Returns: (is_valid, error_message)
    
    Security: Reads actual file header to detect content type spoofing
    
    Examples:
        - PDF must start with %PDF
        - DOCX must start with PK (ZIP header)
    """
    # Read first 8 bytes
    first_bytes = await file.read(8)
    await file.seek(0)  # Reset for further processing
    
    # Determine expected magic bytes
    ext_normalized = expected_ext.lstrip('.')
    expected_magic = MAGIC_BYTES.get(ext_normalized)
    
    if not expected_magic:
        return False, f"Unknown expected type: {expected_ext}"
    
    # Verify magic bytes
    if not first_bytes.startswith(expected_magic):
        return False, f"File content does not match extension {expected_ext}. Possible file type spoofing."
    
    return True, None
```

#### Layer 4: Size Validation (Streaming)

**Purpose**: Prevent memory exhaustion attacks

```python
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

async def verify_size_streaming(file: UploadFile) -> tuple[bool, int, str | None]:
    """
    Validate file size using streaming to prevent memory exhaustion.
    
    Returns: (is_valid, size_bytes, error_message)
    
    Security: Reads file in chunks to handle large malicious uploads safely
    
    Memory safety: Never loads entire file into memory
    """
    size = 0
    chunk_size = 8192  # 8 KB chunks
    
    try:
        while chunk := await file.read(chunk_size):
            size += len(chunk)
            
            # Check size on each chunk
            if size > MAX_FILE_SIZE:
                await file.seek(0)  # Reset for cleanup
                return False, size, f"File too large: {size / (1024 * 1024):.2f} MB. Maximum: {MAX_FILE_SIZE / (1024 * 1024):.1f} MB"
        
        # Reset file pointer for further processing
        await file.seek(0)
        return True, size, None
        
    except Exception as e:
        logger.exception("Error during file size validation")
        return False, 0, f"File reading error: {str(e)}"
```

#### Additional: Macro Detection (DOCX)

**Purpose**: Detect and reject macro-enabled documents

```python
async def check_for_macros(file: UploadFile) -> tuple[bool, str | None]:
    """
    Check if DOCX file contains macros (VBA code).
    
    Returns: (has_macros, error_message)
    
    Security: Macro-enabled documents (.docm) can execute arbitrary code
    
    Detection: Checks for vbaProject.bin inside the DOCX ZIP archive
    """
    try:
        # Read file content
        content = await file.read()
        await file.seek(0)  # Reset
        
        # DOCX is a ZIP file - check for VBA project
        if b"vbaProject.bin" in content:
            return True, "Macro-enabled documents not allowed for security reasons"
        
        return False, None
        
    except Exception as e:
        logger.exception("Error checking for macros")
        return False, f"Error checking file: {str(e)}"
```

#### Master Validation Function

**Purpose**: Orchestrate all validation layers

```python
from fastapi import HTTPException, status, UploadFile
import logging

logger = logging.getLogger(__name__)

async def validate_upload_security(file: UploadFile) -> dict:
    """
    Complete EMMS validation pipeline for file uploads.
    
    Validates in order:
    1. Extension (whitelist + double extension check)
    2. MIME type (Content-Type header)
    3. Magic bytes (actual file content)
    4. Size (streaming validation)
    5. Macros (DOCX only)
    
    Returns: Dict with validation details
    
    Raises:
        HTTPException: 415 for type errors, 413 for size errors
        
    Usage:
        ```python
        @router.post("/upload")
        async def upload_resume(file: UploadFile):
            # Validate BEFORE processing
            validation_result = await validate_upload_security(file)
            
            # Now safe to process
            result = await process_file(file)
            return result
        ```
    
    Security: Defense-in-depth with 5 independent checks
    """
    logger.info("Starting file upload validation: %s", file.filename)
    
    # Step 1: Extension validation
    is_valid_ext, ext, ext_error = verify_extension(file.filename)
    if not is_valid_ext:
        logger.warning("Extension validation failed: %s - %s", file.filename, ext_error)
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=ext_error or "Invalid file extension"
        )
    
    logger.debug("Extension validation passed: %s", ext)
    
    # Step 2: MIME type validation
    is_valid_mime, mime_type, mime_error = verify_mime_type(file)
    if not is_valid_mime:
        logger.warning("MIME type validation failed: %s - %s", file.filename, mime_error)
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=mime_error or "Invalid MIME type"
        )
    
    logger.debug("MIME type validation passed: %s", mime_type)
    
    # Step 3: Magic bytes validation
    is_valid_magic, magic_error = await verify_magic_bytes(file, ext)
    if not is_valid_magic:
        logger.warning("Magic bytes validation failed: %s - %s", file.filename, magic_error)
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=magic_error or "File content mismatch"
        )
    
    logger.debug("Magic bytes validation passed")
    
    # Step 4: Size validation (streaming)
    is_valid_size, size, size_error = await verify_size_streaming(file)
    if not is_valid_size:
        logger.warning("Size validation failed: %s - %s", file.filename, size_error)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=size_error or "File too large"
        )
    
    logger.debug("Size validation passed: %d bytes", size)
    
    # Step 5: Macro check (DOCX only)
    if ext == ".docx":
        has_macros, macro_error = await check_for_macros(file)
        if has_macros:
            logger.warning("Macro detection triggered: %s", file.filename)
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=macro_error or "Macro-enabled documents not allowed"
            )
        logger.debug("Macro check passed (no macros detected)")
    
    logger.info("File upload validation successful: %s (%d bytes)", file.filename, size)
    
    return {
        "valid": True,
        "filename": file.filename,
        "extension": ext,
        "mime_type": mime_type,
        "size_bytes": size,
        "validation_layers_passed": 5 if ext == ".docx" else 4
    }
```

#### Integration Example

**How to use in controller**:

```python
# features/resumes/controller.py

from fastapi import UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from .security import validate_upload_security
from .service import upload_and_parse_resume
from .schemas import UploadResumeResponse

async def upload_resume(
    file: UploadFile,
    db: AsyncSession
) -> UploadResumeResponse:
    """
    Upload and parse resume with complete security validation.
    
    Security: EMMS pattern applied BEFORE any processing
    """
    # CRITICAL: Validate BEFORE processing
    validation_result = await validate_upload_security(file)
    
    # File is now safe to process
    result = await upload_and_parse_resume(file, db)
    
    return UploadResumeResponse(**result)
```

#### Testing Requirements

**Minimum test cases** (15+ tests required):

```python
import pytest
from fastapi import UploadFile
from io import BytesIO

# Extension validation tests
async def test_valid_pdf_extension():
    """Test .pdf extension passes validation"""
    assert verify_extension("resume.pdf") == (True, ".pdf", None)

async def test_valid_docx_extension():
    """Test .docx extension passes validation"""
    assert verify_extension("resume.docx") == (True, ".docx", None)

async def test_double_extension_rejected():
    """Test malicious double extension is rejected"""
    is_valid, _, error = verify_extension("malicious.php.pdf")
    assert is_valid is False
    assert "Double extensions" in error

async def test_invalid_extension_rejected():
    """Test .exe, .zip, .js extensions are rejected"""
    is_valid, ext, _ = verify_extension("malicious.exe")
    assert is_valid is False
    assert ext == ".exe"

# Magic bytes tests
async def test_pdf_magic_bytes_match():
    """Test PDF with correct magic bytes passes"""
    file = create_mock_file(b"%PDF-1.4...", "resume.pdf", "application/pdf")
    is_valid, error = await verify_magic_bytes(file, ".pdf")
    assert is_valid is True
    assert error is None

async def test_pdf_magic_bytes_mismatch():
    """Test fake PDF (wrong magic bytes) is rejected"""
    file = create_mock_file(b"FAKE DATA", "resume.pdf", "application/pdf")
    is_valid, error = await verify_magic_bytes(file, ".pdf")
    assert is_valid is False
    assert "does not match" in error

async def test_docx_magic_bytes_match():
    """Test DOCX with correct ZIP header passes"""
    file = create_mock_file(b"PK\x03\x04...", "resume.docx", "application/vnd...")
    is_valid, error = await verify_magic_bytes(file, ".docx")
    assert is_valid is True

# Size validation tests
async def test_file_within_size_limit():
    """Test 4MB file passes 5MB limit"""
    file = create_mock_file(b"x" * (4 * 1024 * 1024), "resume.pdf", "application/pdf")
    is_valid, size, error = await verify_size_streaming(file)
    assert is_valid is True
    assert size == 4 * 1024 * 1024

async def test_file_exceeds_size_limit():
    """Test 6MB file fails 5MB limit"""
    file = create_mock_file(b"x" * (6 * 1024 * 1024), "resume.pdf", "application/pdf")
    is_valid, size, error = await verify_size_streaming(file)
    assert is_valid is False
    assert "too large" in error

# Macro detection tests
async def test_docx_without_macros_passes():
    """Test clean DOCX without macros passes"""
    file = create_mock_file(b"PK\x03\x04...clean content...", "resume.docx", "...")
    has_macros, error = await check_for_macros(file)
    assert has_macros is False

async def test_docx_with_macros_rejected():
    """Test macro-enabled DOCX is rejected"""
    file = create_mock_file(b"...vbaProject.bin...", "resume.docm", "...")
    has_macros, error = await check_for_macros(file)
    assert has_macros is True
    assert "Macro" in error

# Integration test
async def test_complete_validation_pipeline():
    """Test full EMMS pipeline with valid file"""
    file = create_valid_pdf_file()  # Helper that creates proper PDF
    result = await validate_upload_security(file)
    assert result["valid"] is True
    assert result["extension"] == ".pdf"
    assert result["validation_layers_passed"] == 4
```

#### Security Monitoring

**Logging strategy**:

```python
# Log all validation failures for security monitoring
logger.warning(
    "Security validation failed: %s | Type: %s | User: %s | IP: %s",
    failure_reason,
    violation_type,  # "extension", "magic_bytes", "size", etc.
    user_id or "anonymous",
    request.client.host
)

# Metrics for monitoring dashboard
security_validation_failures.labels(
    violation_type=violation_type,
    file_extension=ext
).inc()
```

#### Security Best Practices

**Do's**:
- ✅ Always validate in all 4 (or 5) layers
- ✅ Validate BEFORE any processing or storage
- ✅ Use streaming for size validation
- ✅ Reset file pointer after each read operation
- ✅ Log all validation failures
- ✅ Use specific HTTP status codes (415, 413)
- ✅ Test all edge cases

**Don'ts**:
- ❌ Never skip any validation layer
- ❌ Never trust file extension alone
- ❌ Never trust MIME type alone
- ❌ Never load entire file into memory for size check
- ❌ Never process files before validation
- ❌ Never expose detailed error messages to users (log internally)

**When to Apply**:
- Resume/CV uploads
- Profile picture uploads
- Document attachments
- Portfolio file uploads
- Any user-uploaded content

**Cross-Reference**: 
- Implementation guide: `docs/sprint/SPRINT_IMPLEMENTATION_GUIDE.md` → Task 1
- Testing patterns: See [Testing Patterns](#testing-patterns) section below

---

## Pydantic v2 Patterns

### Migration from v1 to v2

**Breaking Changes**:

| Pydantic v1 (❌ DEPRECATED) | Pydantic v2 (✅ REQUIRED) |
|----------------------------|--------------------------|
| `@validator` | `@field_validator` |
| `.dict()` | `.model_dump()` |
| `.json()` | `.model_dump_json()` |
| `Config` class | `ConfigDict` or `model_config` |
| `orm_mode = True` | `from_attributes = True` |
| `allow_population_by_field_name = True` | `populate_by_name = True` |

### Complete Pydantic v2 Pattern

```python
from pydantic import Field, field_validator, field_serializer, ConfigDict
from typing import Any
from app.shared.schemas import APIModel


class ResumeContact(APIModel):
    """Contact information from resume."""
    
    # Use ConfigDict for model configuration (instead of Config class)
    model_config = ConfigDict(
        str_strip_whitespace=True,  # Automatically strip whitespace
        str_min_length=1,            # Reject empty strings
        strict=True,                 # Strict type validation
    )
    
    name: str = Field(..., min_length=1, max_length=200, description="Full name")
    email: str = Field(..., description="Email address")
    phone: str | None = Field(None, description="Phone number (optional)")
    linkedin: str | None = Field(None, description="LinkedIn URL (optional)")
    github: str | None = Field(None, description="GitHub URL (optional)")
    
    # Field validator (Pydantic v2 syntax)
    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        """Validate and normalize email address."""
        v = v.lower().strip()
        if "@" not in v or "." not in v.split("@")[1]:
            raise ValueError("Invalid email format")
        return v
    
    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        """Normalize phone number format."""
        if v is None:
            return None
        # Remove non-digit characters
        digits = "".join(c for c in v if c.isdigit())
        if len(digits) < 10:
            raise ValueError("Phone number must have at least 10 digits")
        return digits
    
    @field_validator("linkedin", "github")
    @classmethod
    def validate_url(cls, v: str | None) -> str | None:
        """Validate URL format."""
        if v is None:
            return None
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v
    
    # Field serializer (for custom output format)
    @field_serializer("phone")
    def serialize_phone(self, value: str | None) -> str | None:
        """Format phone number for display."""
        if value is None or len(value) < 10:
            return value
        # Format as (XXX) XXX-XXXX
        return f"({value[:3]}) {value[3:6]}-{value[6:]}"
```

**Key Points**:
- Use `@field_validator` with `@classmethod` decorator (required in v2)
- Use `@field_serializer` for custom output formatting
- Use `model_dump()` instead of `.dict()`
- Use `model_validate()` to convert from dict or ORM model
- Use `ConfigDict` for model configuration
- Inherit from `APIModel` for shared configuration

**Cross-Reference**: See [ARCHITECTURE.md § Technology Stack](./ARCHITECTURE.md#technology-stack) for Pydantic v2 rationale.

---

## SQLAlchemy 2.0 Async Patterns

### Query Patterns

**Basic Query (SELECT)**:

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models_resume import Resume


async def get_resume_by_id(resume_id: int, db: AsyncSession) -> Resume | None:
    """Fetch single resume by ID."""
    stmt = select(Resume).where(Resume.id == resume_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()
```

**Filtered Query with Multiple Conditions**:

```python
async def get_resumes_by_status(
    status: str,
    limit: int,
    db: AsyncSession
) -> list[Resume]:
    """Fetch resumes by status with limit."""
    stmt = (
        select(Resume)
        .where(Resume.status == status)
        .order_by(Resume.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())
```

**Pagination Pattern**:

```python
from sqlalchemy import select, func

async def get_paginated_resumes(
    page: int,
    per_page: int,
    db: AsyncSession
) -> tuple[list[Resume], int]:
    """
    Fetch paginated resumes with total count.
    
    Returns: (resumes, total_count)
    """
    # Count total (separate query for accuracy)
    count_stmt = select(func.count()).select_from(Resume)
    total_count = await db.scalar(count_stmt) or 0
    
    # Fetch page
    offset = (page - 1) * per_page
    stmt = (
        select(Resume)
        .order_by(Resume.created_at.desc())
        .offset(offset)
        .limit(per_page)
    )
    result = await db.execute(stmt)
    resumes = list(result.scalars().all())
    
    return resumes, total_count
```

**Relationship Loading (Eager Load)**:

```python
from sqlalchemy.orm import selectinload

async def get_user_with_resumes(user_id: int, db: AsyncSession):
    """Fetch user with all resumes (eager loading)."""
    stmt = (
        select(User)
        .where(User.id == user_id)
        .options(selectinload(User.resumes))  # Eager load relationship
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()
```

### Transaction Patterns

**Simple Transaction (Auto-commit)**:

```python
async def create_resume(data: dict, db: AsyncSession) -> Resume:
    """Create new resume (auto-commit)."""
    resume = Resume(**data)
    db.add(resume)
    await db.commit()
    await db.refresh(resume)  # Refresh to get generated ID
    return resume
```

**Complex Transaction with Rollback**:

```python
async def complex_operation(data: dict, db: AsyncSession) -> Resume:
    """
    Complex multi-step operation with rollback on error.
    
    Uses explicit transaction management for safety.
    """
    try:
        # Step 1: Create main record
        resume = Resume(**data.main)
        db.add(resume)
        await db.flush()  # Flush to get ID without committing
        
        # Step 2: Create related records
        for exp_data in data.experiences:
            experience = Experience(resume_id=resume.id, **exp_data)
            db.add(experience)
        
        # Step 3: Update another table
        user = await fetch_user(data.user_id, db)
        user.resume_count += 1
        
        # Commit all changes atomically
        await db.commit()
        await db.refresh(resume)
        
        return resume
        
    except Exception as e:
        # Rollback on any error
        await db.rollback()
        logger.error("Transaction failed: %s", e)
        raise ValueError(f"Failed to create resume: {str(e)}")
```

**Bulk Insert Pattern**:

```python
async def bulk_insert_skills(resume_id: int, skills: list[str], db: AsyncSession):
    """Bulk insert skills efficiently."""
    skill_objects = [
        Skill(resume_id=resume_id, name=skill)
        for skill in skills
    ]
    db.add_all(skill_objects)
    await db.commit()
```

### Session Management

**Correct Session Usage**:

```python
# ✅ CORRECT: Use dependency injection
from app.core.db import get_db

@router.get("/resumes/{resume_id}")
async def get_resume_endpoint(
    resume_id: int,
    db: AsyncSession = Depends(get_db)  # Dependency injection
):
    return await get_resume(resume_id, db)
```

**Session Context Manager (for scripts/background tasks)**:

```python
from app.core.db import AsyncSessionLocal

async def background_task():
    """Example background task with manual session management."""
    async with AsyncSessionLocal() as session:
        # All database operations within context
        resume = await fetch_resume_by_id(1, session)
        await process_resume(resume, session)
        await session.commit()
    # Session automatically closed here
```

**Key Points**:
- Always use `async`/`await` for database operations
- Use `select()` for queries (not `session.query()`)
- Use `result.scalar_one_or_none()` for single result
- Use `result.scalars().all()` for multiple results
- Use `flush()` to get ID without committing
- Use `commit()` to persist changes
- Use `rollback()` in exception handlers
- Use `refresh()` to reload model after commit

**Cross-Reference**: See [ARCHITECTURE.md § Data Flow](./ARCHITECTURE.md#data-flow) for database transaction flow.

---

## Security Validation Patterns

See [Layer 5: Security](#layer-5-security-securitypy---validation--sanitization) above for complete EMMS pattern.

**Additional Security Best Practices**:

1. **SQL Injection Prevention**:
   - ✅ Use SQLAlchemy ORM (parameterized queries)
   - ❌ Never concatenate SQL strings
   
2. **XSS Prevention**:
   - ✅ Sanitize all user input before storing
   - ✅ Use Content-Security-Policy headers
   - ❌ Never trust client-side validation alone

3. **CSRF Prevention**:
   - ✅ Use FastAPI CORS middleware with explicit origins
   - ✅ Implement CSRF tokens for state-changing operations (future)

4. **Secrets Management**:
   - ✅ Use environment variables for secrets
   - ✅ Use pydantic-settings for configuration
   - ❌ Never commit secrets to version control

### Auth Endpoint Considerations

- Normalize authentication failures to HTTP 401 (Unauthorized) for missing/invalid credentials to enable client refresh flows. Use `HTTPBearer(auto_error=False)` and raise explicit 401s in the dependency (avoid 403 for unauthenticated cases).
- Exempt critical auth paths from generic rate limiting to prevent breaking initial session restore and refresh on page load. Recommended bypass list:
    - `/api/v1/auth/me`
    - `/api/v1/auth/refresh`
    - `/api/v1/auth/login`
    - `/api/v1/auth/logout`
- Keep general bypasses for non-API noise: `OPTIONS`, `HEAD`, `/favicon.ico`, `/robots.txt`, and `/.well-known/`.

---

## Error Handling Patterns

### HTTP Status Code Guidelines

| Status Code | Use Case | Example |
|-------------|----------|---------|
| **200** | Success (GET, PUT) | Retrieved resource, updated successfully |
| **201** | Created (POST) | Resource created successfully |
| **204** | No Content (DELETE) | Resource deleted successfully |
| **400** | Bad Request | Invalid input, validation error |
| **401** | Unauthorized | Missing or invalid authentication |
| **403** | Forbidden | Authenticated but not authorized |
| **404** | Not Found | Resource doesn't exist |
| **409** | Conflict | Resource already exists |
| **413** | Payload Too Large | File size exceeds limit |
| **415** | Unsupported Media Type | Invalid file type |
| **422** | Unprocessable Entity | Valid format but business logic error |
| **500** | Internal Server Error | Unexpected server error |

### Error Handling Pattern

```python
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)


async def controller_function(data: dict, db: AsyncSession):
    """Example controller with comprehensive error handling."""
    try:
        # Call service layer
        result = await service_function(data, db)
        return result
        
    except ValueError as e:
        # Business logic errors → 400
        logger.warning("Validation error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    except FileNotFoundError as e:
        # Resource not found → 404
        logger.info("Resource not found: %s", e)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    
    except PermissionError as e:
        # Authorization error → 403
        logger.warning("Permission denied: %s", e)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to perform this action"
        )
    
    except Exception as e:
        # Unexpected errors → 500
        logger.exception("Unexpected error in controller")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )
```

---

## Testing Patterns

### Test File Structure

```
backend/app/tests/
  ├── __init__.py
  ├── conftest.py              # Shared fixtures
  ├── unit/                     # Unit tests (no database)
  │   ├── test_parsing.py
  │   ├── test_normalizers.py
  │   └── test_validators.py
  └── features/                 # Integration tests (with database)
      ├── test_resumes.py
      └── test_portfolios.py
```

### Pytest Fixtures (conftest.py)

```python
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.db import get_db, Base


# Test database URL
TEST_DATABASE_URL = "postgresql+asyncpg://test:test@localhost:5432/test_db"


@pytest_asyncio.fixture
async def db_engine():
    """Create test database engine."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # Drop all tables after tests
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine):
    """Create test database session."""
    async_session = async_sessionmaker(
        db_engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_session):
    """Create test client with database dependency override."""
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac
    
    app.dependency_overrides.clear()
```

### Unit Test Example

```python
import pytest
from app.features.parsing.normalizers import normalize_contact


def test_normalize_contact_valid():
    """Test contact normalization with valid data."""
    raw_data = {
        "name": " John Doe ",
        "email": "JOHN@EXAMPLE.COM",
        "phone": "(555) 123-4567",
    }
    
    result = normalize_contact(raw_data)
    
    assert result["name"] == "John Doe"
    assert result["email"] == "john@example.com"
    assert result["phone"] == "5551234567"


def test_normalize_contact_missing_required_fields():
    """Test contact normalization with missing required fields."""
    raw_data = {"name": "John Doe"}
    
    with pytest.raises(ValueError, match="Email is required"):
        normalize_contact(raw_data)
```

### Integration Test Example

```python
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_upload_resume_success(client: AsyncClient):
    """Test successful resume upload."""
    # Create mock PDF file
    files = {
        "file": ("test_resume.pdf", b"%PDF-1.4\n... content ...", "application/pdf")
    }
    
    response = await client.post("/api/v1/resumes/upload", files=files)
    
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "parsed"
    assert "id" in data
    assert data["message"] == "Resume uploaded and parsed successfully"


@pytest.mark.asyncio
async def test_upload_resume_invalid_type(client: AsyncClient):
    """Test upload with invalid file type."""
    files = {
        "file": ("test.txt", b"plain text content", "text/plain")
    }
    
    response = await client.post("/api/v1/resumes/upload", files=files)
    
    assert response.status_code == 415
    assert "Unsupported file type" in response.json()["detail"]


@pytest.mark.asyncio
async def test_get_resume_not_found(client: AsyncClient):
    """Test getting non-existent resume."""
    response = await client.get("/api/v1/resumes/99999")
    
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
```

**Key Points**:
- Use `pytest-asyncio` for async tests
- Use fixtures for database setup/teardown
- Test both success and error cases
- Use `AsyncClient` for FastAPI integration tests
- Mock external services (file parsers, AI APIs)
- Aim for >80% code coverage

---

## Alembic Migration Patterns

### Creating Migrations

```bash
# Generate migration from model changes
docker compose exec backend alembic revision --autogenerate -m "Add user_id to resumes"

# Create empty migration for data migration
docker compose exec backend alembic revision -m "Populate default values"
```

### Migration File Pattern

```python
"""Add user_id to resumes

Revision ID: abc123def456
Revises: previous_revision_id
Create Date: 2025-10-18 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'abc123def456'
down_revision = 'previous_revision_id'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade database schema."""
    # Schema changes
    op.add_column(
        'resumes',
        sa.Column('user_id', sa.Integer(), nullable=True)
    )
    op.create_foreign_key(
        'fk_resumes_user_id',
        'resumes',
        'users',
        ['user_id'],
        ['id'],
        ondelete='CASCADE'
    )
    op.create_index(
        'ix_resumes_user_id',
        'resumes',
        ['user_id']
    )


def downgrade() -> None:
    """Downgrade database schema."""
    op.drop_index('ix_resumes_user_id', table_name='resumes')
    op.drop_constraint('fk_resumes_user_id', 'resumes', type_='foreignkey')
    op.drop_column('resumes', 'user_id')
```

### Data Migration Pattern

```python
"""Populate default resume status

Revision ID: def456abc789
Revises: abc123def456
Create Date: 2025-10-18 10:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column


revision = 'def456abc789'
down_revision = 'abc123def456'


def upgrade() -> None:
    """Set default status for existing resumes."""
    # Define table structure for data migration
    resumes_table = table(
        'resumes',
        column('id', sa.Integer),
        column('status', sa.String),
    )
    
    # Update existing records
    op.execute(
        resumes_table.update()
        .where(resumes_table.c.status == None)
        .values(status='parsed')
    )
    
    # Make column non-nullable after populating
    op.alter_column('resumes', 'status', nullable=False)


def downgrade() -> None:
    """Revert status column changes."""
    op.alter_column('resumes', 'status', nullable=True)
```

**Key Points**:
- Always implement `downgrade()` for rollback capability
- Test migrations in development before production
- Separate schema migrations from data migrations
- Use transactions (migrations run in transaction by default)
- Never delete data in `upgrade()` without backup strategy

**Cross-Reference**: See [ARCHITECTURE.md § Migration Philosophy](./ARCHITECTURE.md#migration-philosophy) for safety principles.

---

## Common Pitfalls & Solutions

### Pitfall 1: Using Pydantic v1 Syntax

**Problem**:
```python
# ❌ WRONG (Pydantic v1)
from pydantic import validator

class Model(BaseModel):
    email: str
    
    @validator("email")
    def validate_email(cls, v):
        return v.lower()
```

**Solution**:
```python
# ✅ CORRECT (Pydantic v2)
from pydantic import field_validator

class Model(APIModel):
    email: str
    
    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return v.lower()
```

### Pitfall 2: Using Sync SQLAlchemy Queries

**Problem**:
```python
# ❌ WRONG (Sync API)
resume = session.query(Resume).filter_by(id=resume_id).first()
```

**Solution**:
```python
# ✅ CORRECT (Async API)
stmt = select(Resume).where(Resume.id == resume_id)
result = await session.execute(stmt)
resume = result.scalar_one_or_none()
```

### Pitfall 3: Not Resetting File Pointer

**Problem**:
```python
# ❌ WRONG (File pointer not reset)
content = await file.read()
# ... validation ...
text = await extract_text(file)  # Returns empty! File pointer at end
```

**Solution**:
```python
# ✅ CORRECT (Reset file pointer)
content = await file.read()
await file.seek(0)  # Reset to beginning
# ... validation ...
text = await extract_text(file)  # Works correctly
```

### Pitfall 4: Missing Error Logging

**Problem**:
```python
# ❌ WRONG (No logging before raising)
except Exception:
    raise HTTPException(status_code=500, detail="Error")
```

**Solution**:
```python
# ✅ CORRECT (Log before raising)
except Exception as e:
    logger.exception("Unexpected error during operation")
    raise HTTPException(
        status_code=500,
        detail="An unexpected error occurred"
    )
```

### Pitfall 5: Accessing Relationships After Session Closed

**Problem**:
```python
# ❌ WRONG (Relationship accessed after session closed)
async with AsyncSessionLocal() as session:
    user = await fetch_user(user_id, session)

# Session closed here
resumes = user.resumes  # ❌ Error! Relationship not loaded
```

**Solution**:
```python
# ✅ CORRECT (Eager load relationships)
from sqlalchemy.orm import selectinload

async with AsyncSessionLocal() as session:
    stmt = select(User).where(User.id == user_id).options(selectinload(User.resumes))
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()
    
    # Access relationships inside session
    resumes = user.resumes  # ✅ Works!
```

---

## Code Quality Checklist

Before submitting code for review, verify:

### Code Style
- [ ] Code formatted with `black` (line length 88)
- [ ] Linting passes with `ruff` (no errors)
- [ ] Type checking passes with `mypy` (no errors)
- [ ] Security scan passes with `bandit` (no high-severity issues)

### Architecture
- [ ] Code follows WHDS-G pattern (routes → controller → service → schemas → security)
- [ ] Separation of concerns maintained (no business logic in controllers)
- [ ] No HTTP concerns in service layer (no HTTPException)
- [ ] Pydantic v2 syntax used (field_validator, model_dump)
- [ ] SQLAlchemy 2.0 async syntax used (select, await execute)

### Security
- [ ] All file uploads validated with EMMS pattern (extension, MIME, magic bytes, size)
- [ ] All user inputs sanitized
- [ ] No SQL injection vulnerabilities (parameterized queries only)
- [ ] No secrets in code or logs
- [ ] Proper error messages (no sensitive data leaked)

### Testing
- [ ] Unit tests for all service functions
- [ ] Integration tests for API endpoints
- [ ] Test coverage >80%
- [ ] All tests passing
- [ ] Edge cases covered

### Documentation
- [ ] All functions have docstrings (Google style)
- [ ] All parameters have type hints
- [ ] OpenAPI descriptions added to routes
- [ ] README updated if needed

### Database
- [ ] Migrations created and tested
- [ ] `downgrade()` function implemented
- [ ] No breaking changes without migration path
- [ ] Database queries optimized (no N+1 queries)

---

## Quick Command Reference

```bash
# Code formatting
black backend/app/
ruff check backend/app/ --fix

# Type checking
mypy backend/app/

# Security scanning
bandit -r backend/app/ -x tests

# Testing
pytest backend/app/tests/                    # All tests
pytest backend/app/tests/unit/               # Unit only
pytest backend/app/tests/ --cov=app --cov-report=html  # With coverage
pytest -k "test_upload" -v                   # Specific test

# Migrations
docker compose exec backend alembic revision --autogenerate -m "description"
docker compose up migrate
docker compose exec backend alembic current
docker compose exec backend alembic history
docker compose exec backend alembic downgrade -1

# Development
docker compose up -d                         # Start all services
docker compose logs -f backend               # View logs
docker compose restart backend               # Restart after changes
docker compose down                          # Stop all services
```

---

## Cross-References

**For more information, see:**

- [copilot-instructions.md](../copilot-instructions.md) - Master instruction file
 - [copilot-instructions.md](./copilot-instructions.md) - Master instruction file
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture and design decisions
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - Quick reference and memory aids
- [python.instructions.md](./python.instructions.md) - General Python conventions
- [frontend.instructions.md](./frontend.instructions.md) - Frontend patterns (for API contract understanding)

**Canonical Code Example**: `backend/app/features/resumes/` - Study this as reference implementation

---

**Version**: 4.0  
**Last Updated**: November 2025  
**Maintainer**: Backend Team (Israel, Ido, Yarin)  
**Next Review**: December 2025

**Feedback**: Open PR with suggested improvements to this file