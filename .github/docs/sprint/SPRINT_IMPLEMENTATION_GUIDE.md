# Sprint Implementation Guide v1.0
## Portfolio Builder - Current Sprint Tasks with Architecture Patterns

> **Version**: 1.0  
> **Sprint**: Current  
> **Last Updated**: November 2025  
> **Status**: Active Development

---

## 📋 Table of Contents

1. [Sprint Overview](#sprint-overview)
2. [Priority Matrix](#priority-matrix)
3. [Task Implementation Guides](#task-implementation-guides)
   - [P0: Critical Security & Auth](#p0-critical-security--auth)
   - [P1: Core Features](#p1-core-features)
   - [P2: Testing & Quality](#p2-testing--quality)
   - [P3: Deployment & Infrastructure](#p3-deployment--infrastructure)
4. [Portfolio Dashboard Architecture](#portfolio-dashboard-architecture)
5. [Implementation Patterns](#implementation-patterns)
6. [Team Coordination](#team-coordination)

---

## Sprint Overview

### Goals
- ✅ Complete authentication flow and security
- ✅ Implement portfolio dashboard and versioning
- ✅ Establish comprehensive testing coverage
- ✅ Prepare production deployment infrastructure

### Team Assignments
| Role | Developer | Focus Areas |
|------|-----------|-------------|
| **Team Lead & Full-Stack** | Amir | Architecture, Code Review, Technical Decisions |
| **Backend** | Israel | Core APIs, Business Logic, Security |
| **Backend** | Ido | Database, Migrations, Testing |
| **Backend & DevOps** | Yarin | APIs, CI/CD, Infrastructure |
| **Frontend** | Netanel | Dashboard UI, Auth Flow, E2E Tests |
| **Security** | Morris | Security Reviews, Penetration Testing |
| **Project Manager** | Hezi | Sprint Planning, Tracking, Coordination |
| **UI/UX Designer** | Yoad | Design System, User Flows, Mockups |

---

## Priority Matrix

### P0: Critical (Must complete before anything else)
```
┌─────────────────────────────────────────────────────────┐
│ 🔴 P0 - BLOCKING TASKS                                  │
├─────────────────────────────────────────────────────────┤
│ 1. File Upload Security Layer                          │
│ 2. Database Resumes-Users Link                         │
│ 3. UI Login-Registration Behavior Fixes                │
└─────────────────────────────────────────────────────────┘
```

### P1: High Priority (Core MVP features)
```
┌─────────────────────────────────────────────────────────┐
│ 🟠 P1 - HIGH PRIORITY                                   │
├─────────────────────────────────────────────────────────┤
│ 4. Portfolio Dashboard Screen                          │
│ 5. Portfolio Versioning System                         │
│ 6. User Dashboard API                                  │
│ 7. Authorization & Permission Tests                    │
└─────────────────────────────────────────────────────────┘
```

### P2: Medium Priority (Quality & Testing)
```
┌─────────────────────────────────────────────────────────┐
│ 🟡 P2 - MEDIUM PRIORITY                                 │
├─────────────────────────────────────────────────────────┤
│ 8. E2E Tests for Critical User Flows                   │
│ 9. Frontend Auth Store Unit Tests                      │
│ 10. Rate Limiting Automated Tests                      │
│ 11. Migration Verification Tests                       │
│ 12. Smoke Tests for Empty Endpoints                    │
└─────────────────────────────────────────────────────────┘
```

### P3: Lower Priority (Infrastructure)
```
┌─────────────────────────────────────────────────────────┐
│ 🟢 P3 - LOWER PRIORITY                                  │
├─────────────────────────────────────────────────────────┤
│ 13. CI Pipeline Setup                                  │
│ 14. Deployment Pipeline                               │
│ 15. Production Environment Setup                       │
│ 16. Pre-Launch Checklist                              │
│ 17. UI/UX Final Polish                                │
└─────────────────────────────────────────────────────────┘
```

---

## Task Implementation Guides

## P0: Critical Security & Auth

### Task 1: File Upload Security Layer 🔴

**Owner**: Backend (Israel, Ido, Yarin) + Security (Morris)  
**Estimated Time**: 2-3 days  
**Dependencies**: None  
**Blocking**: All upload features

#### Implementation Plan

**Step 1: Create Security Module**
```
backend/app/features/resumes/security.py (NEW)
```

**Pattern**: EMMS (Extension-MIME-Magic-Size)

```python
"""
File upload security validation following EMMS pattern.
Implements defense-in-depth validation for CV uploads.
"""
from typing import Optional, Tuple
import magic
from fastapi import UploadFile, HTTPException, status
import logging

logger = logging.getLogger(__name__)

# Security constants
ALLOWED_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB in bytes
MAGIC_BYTES = {
    "pdf": b"%PDF",
    "docx": b"PK\x03\x04"
}
CHUNK_SIZE = 8192  # 8KB chunks for streaming


class FileSecurityError(Exception):
    """Base exception for file security violations"""
    pass


def verify_extension(filename: str) -> Tuple[bool, Optional[str]]:
    """
    Verify file extension against whitelist.
    Detects double extensions (e.g., .php.pdf)
    
    Args:
        filename: Original filename from upload
        
    Returns:
        Tuple of (is_valid, extension or error_message)
    """
    if not filename or "." not in filename:
        return False, "File must have an extension"
    
    # Get all extensions (detect double extensions)
    parts = filename.lower().split(".")
    if len(parts) > 2:
        # Multiple extensions detected (e.g., file.php.pdf)
        logger.warning(f"Double extension detected: {filename}")
        return False, "Double extensions not allowed"
    
    ext = f".{parts[-1]}"
    
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Extension {ext} not allowed. Only {ALLOWED_EXTENSIONS}"
    
    return True, ext


def verify_magic_bytes(file_content: bytes, expected_ext: str) -> bool:
    """
    Verify file magic bytes match declared extension.
    Prevents extension spoofing.
    
    Args:
        file_content: First 4-8 bytes of file
        expected_ext: Extension from filename (without dot)
        
    Returns:
        True if magic bytes match extension
    """
    expected_magic = MAGIC_BYTES.get(expected_ext.lstrip("."))
    if not expected_magic:
        logger.error(f"No magic bytes defined for {expected_ext}")
        return False
    
    if not file_content.startswith(expected_magic):
        logger.warning(
            f"Magic byte mismatch. Expected {expected_magic}, "
            f"got {file_content[:4]}"
        )
        return False
    
    return True


def verify_mime_type(file: UploadFile) -> Tuple[bool, Optional[str]]:
    """
    Verify MIME type from Content-Type header.
    
    Args:
        file: FastAPI UploadFile object
        
    Returns:
        Tuple of (is_valid, mime_type or error_message)
    """
    mime_type = file.content_type
    
    if mime_type not in ALLOWED_MIME_TYPES:
        return False, f"MIME type {mime_type} not allowed"
    
    return True, mime_type


async def verify_size_streaming(file: UploadFile) -> bool:
    """
    Verify file size without loading entire file into memory.
    Streams file and counts bytes.
    
    Args:
        file: FastAPI UploadFile object
        
    Returns:
        True if size is within limit
        
    Raises:
        HTTPException: If file exceeds size limit
    """
    total_size = 0
    
    # Reset file pointer
    await file.seek(0)
    
    # Read in chunks
    while True:
        chunk = await file.read(CHUNK_SIZE)
        if not chunk:
            break
        
        total_size += len(chunk)
        
        if total_size > MAX_FILE_SIZE:
            logger.warning(f"File too large: {total_size} bytes")
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Max size: {MAX_FILE_SIZE / (1024*1024)}MB"
            )
    
    # Reset file pointer for subsequent reads
    await file.seek(0)
    return True


async def check_for_macros(file_content: bytes) -> bool:
    """
    Check DOCX files for embedded macros (VBA code).
    Macros can execute malicious code.
    
    Args:
        file_content: Complete file content
        
    Returns:
        True if no macros detected
    """
    # DOCX is a ZIP archive - check for vbaProject.bin
    if b"vbaProject.bin" in file_content:
        logger.warning("Macro-enabled DOCX detected")
        return False
    
    return True


async def validate_upload_security(file: UploadFile) -> dict:
    """
    Complete EMMS validation pipeline for uploaded files.
    
    Implements defense-in-depth:
    1. Extension validation (whitelist)
    2. MIME type verification
    3. Magic byte inspection
    4. Size limit enforcement
    5. Macro detection (DOCX only)
    
    Args:
        file: FastAPI UploadFile object
        
    Returns:
        Dict with validation results
        
    Raises:
        HTTPException: On any security violation
    """
    try:
        # Step 1: Verify extension
        is_valid_ext, ext_or_error = verify_extension(file.filename)
        if not is_valid_ext:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=ext_or_error
            )
        
        extension = ext_or_error.lstrip(".")
        
        # Step 2: Verify MIME type
        is_valid_mime, mime_or_error = verify_mime_type(file)
        if not is_valid_mime:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=mime_or_error
            )
        
        # Step 3: Read first chunk for magic bytes
        first_chunk = await file.read(8)
        if not verify_magic_bytes(first_chunk, extension):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="File content does not match extension"
            )
        
        # Reset file pointer after reading magic bytes
        await file.seek(0)
        
        # Step 4: Verify size (streaming)
        await verify_size_streaming(file)
        
        # Step 5: Check for macros (DOCX only)
        if extension == "docx":
            # Read entire file for macro check
            await file.seek(0)
            content = await file.read()
            
            if not await check_for_macros(content):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Macro-enabled files not allowed"
                )
            
            # Reset file pointer
            await file.seek(0)
        
        logger.info(f"File validation passed: {file.filename}")
        
        return {
            "valid": True,
            "extension": extension,
            "mime_type": mime_or_error,
            "filename": file.filename
        }
        
    except HTTPException:
        # Re-raise FastAPI exceptions
        raise
    except Exception as e:
        logger.exception("Unexpected error in file validation")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="File validation failed"
        )
```

**Step 2: Integrate with Upload Endpoint**

Update `backend/app/features/resumes/controller.py`:

```python
from .security import validate_upload_security

async def upload_resume(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Require auth
) -> UploadResumeResponse:
    """
    Upload and parse resume with security validation.
    """
    # Security validation BEFORE any processing
    validation_result = await validate_upload_security(file)
    
    # Rest of upload logic...
    result = await resume_service.upload_and_parse_resume(
        file=file,
        user_id=current_user.id,
        db=db
    )
    
    return UploadResumeResponse(**result)
```

**Step 3: Write Security Tests**

Create `backend/app/tests/features/test_file_security.py`:

```python
import pytest
from fastapi import UploadFile
from io import BytesIO
from app.features.resumes.security import (
    verify_extension,
    verify_magic_bytes,
    validate_upload_security
)

class TestExtensionValidation:
    def test_valid_pdf_extension(self):
        is_valid, ext = verify_extension("resume.pdf")
        assert is_valid is True
        assert ext == ".pdf"
    
    def test_valid_docx_extension(self):
        is_valid, ext = verify_extension("resume.docx")
        assert is_valid is True
        assert ext == ".docx"
    
    def test_double_extension_rejected(self):
        is_valid, error = verify_extension("malicious.php.pdf")
        assert is_valid is False
        assert "Double extensions" in error
    
    def test_invalid_extension_rejected(self):
        is_valid, error = verify_extension("script.exe")
        assert is_valid is False
        assert "not allowed" in error
    
    def test_no_extension_rejected(self):
        is_valid, error = verify_extension("noextension")
        assert is_valid is False


class TestMagicByteValidation:
    def test_valid_pdf_magic_bytes(self):
        content = b"%PDF-1.4\n..."
        assert verify_magic_bytes(content, "pdf") is True
    
    def test_valid_docx_magic_bytes(self):
        content = b"PK\x03\x04..."
        assert verify_magic_bytes(content, "docx") is True
    
    def test_pdf_magic_mismatch(self):
        content = b"FAKE PDF CONTENT"
        assert verify_magic_bytes(content, "pdf") is False
    
    def test_docx_magic_mismatch(self):
        content = b"FAKE DOCX"
        assert verify_magic_bytes(content, "docx") is False


@pytest.mark.asyncio
class TestCompleteValidation:
    async def test_valid_pdf_passes_all_checks(self):
        # Create mock PDF file
        pdf_content = b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"
        file = UploadFile(
            filename="test.pdf",
            file=BytesIO(pdf_content),
            content_type="application/pdf"
        )
        
        result = await validate_upload_security(file)
        assert result["valid"] is True
        assert result["extension"] == "pdf"
    
    async def test_file_too_large_rejected(self):
        # Create 6MB file (exceeds 5MB limit)
        large_content = b"%PDF-1.4\n" + b"A" * (6 * 1024 * 1024)
        file = UploadFile(
            filename="large.pdf",
            file=BytesIO(large_content),
            content_type="application/pdf"
        )
        
        with pytest.raises(HTTPException) as exc_info:
            await validate_upload_security(file)
        
        assert exc_info.value.status_code == 413
    
    async def test_wrong_mime_type_rejected(self):
        pdf_content = b"%PDF-1.4\n"
        file = UploadFile(
            filename="test.pdf",
            file=BytesIO(pdf_content),
            content_type="text/plain"  # Wrong MIME type
        )
        
        with pytest.raises(HTTPException) as exc_info:
            await validate_upload_security(file)
        
        assert exc_info.value.status_code == 415
```

**Step 4: Security Review Checklist**
- [ ] All validation layers implemented (EMMS)
- [ ] Double extension detection working
- [ ] Magic byte verification prevents spoofing
- [ ] Streaming size check prevents memory exhaustion
- [ ] Macro detection blocks malicious DOCX
- [ ] All 15+ test cases passing
- [ ] Security logging in place
- [ ] Error messages don't leak system info

---

### Task 2: Database Resumes-Users Link 🔴

**Owner**: Backend (Israel, Ido, Yarin)  
**Estimated Time**: 1 day  
**Dependencies**: Task 1 (File Security)  
**Blocking**: Portfolio features

#### Implementation Plan

**Step 1: Create Migration**

```bash
# Generate migration
docker compose exec backend alembic revision --autogenerate -m "link_resumes_to_users"
```

**Step 2: Edit Migration File**

`backend/app/alembic/versions/XXXX_link_resumes_to_users.py`:

```python
"""link_resumes_to_users

Revision ID: XXXX
Revises: YYYY
Create Date: 2025-11-22
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = 'XXXX'
down_revision = 'YYYY'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Step 1: Add user_id column (nullable initially)
    op.add_column(
        'resumes',
        sa.Column('user_id', sa.Integer(), nullable=True)
    )
    
    # Step 2: Create foreign key constraint
    op.create_foreign_key(
        'fk_resumes_user_id',
        'resumes',
        'users',
        ['user_id'],
        ['id'],
        ondelete='CASCADE'  # Delete resumes when user deleted
    )
    
    # Step 3: Create index for faster queries
    op.create_index(
        'ix_resumes_user_id',
        'resumes',
        ['user_id']
    )
    
    # Step 4: Make user_id NOT NULL after data migration
    # Note: In production, first migrate existing data to have user_id
    # Then uncomment this line:
    # op.alter_column('resumes', 'user_id', nullable=False)


def downgrade() -> None:
    op.drop_index('ix_resumes_user_id', table_name='resumes')
    op.drop_constraint('fk_resumes_user_id', 'resumes', type_='foreignkey')
    op.drop_column('resumes', 'user_id')
```

**Step 3: Update Resume Model**

`backend/app/features/resumes/models.py`:

```python
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.shared.database import Base

class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    parsed_data = Column(JSON, nullable=True)
    status = Column(String, default="uploaded")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationship to user
    user = relationship("User", back_populates="resumes")
```

**Step 4: Update User Model**

`backend/app/features/auth/models.py`:

```python
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"
    
    # ... existing fields ...
    
    # Add relationship to resumes
    resumes = relationship(
        "Resume",
        back_populates="user",
        cascade="all, delete-orphan"  # Delete resumes when user deleted
    )
```

**Step 5: Update Upload Service**

`backend/app/features/resumes/service.py`:

```python
async def upload_and_parse_resume(
    file: UploadFile,
    user_id: int,  # Now required
    db: AsyncSession
) -> dict:
    """
    Upload and parse resume with user ownership.
    """
    # Save file
    file_path = await save_file(file, user_id)
    
    # Parse content
    parsed_data = await parse_resume(file, file_path)
    
    # Create database record with user_id
    resume = Resume(
        user_id=user_id,
        filename=file.filename,
        file_path=file_path,
        parsed_data=parsed_data,
        status="parsed"
    )
    
    db.add(resume)
    await db.commit()
    await db.refresh(resume)
    
    return {
        "id": resume.id,
        "status": resume.status,
        "message": "Resume uploaded and parsed successfully"
    }


async def get_user_resumes(user_id: int, db: AsyncSession) -> list[Resume]:
    """
    Get all resumes for a specific user.
    """
    stmt = select(Resume).where(Resume.user_id == user_id).order_by(Resume.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()
```

**Step 6: Apply Migration**

```bash
# Apply migration
docker compose up migrate

# Verify schema
docker compose exec db psql -U postgres -d portfolio_db -c "\d resumes"
```

**Step 7: Guest Upload Temporary Storage**

Create `backend/app/features/resumes/temp_storage.py`:

```python
"""
Temporary storage for guest uploads.
Files stored outside web root for 2 minutes.
"""
import os
import time
import asyncio
from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)

TEMP_UPLOAD_DIR = Path("/tmp/portfolio_guest_uploads")
TEMP_FILE_TTL = 120  # 2 minutes in seconds

# Ensure temp directory exists
TEMP_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class TempUploadManager:
    """
    Manages temporary uploads for unauthenticated users.
    Files are automatically cleaned up after TTL expires.
    """
    
    _cleanup_task: Optional[asyncio.Task] = None
    
    @classmethod
    async def start_cleanup_task(cls):
        """Start background cleanup task"""
        if cls._cleanup_task is None:
            cls._cleanup_task = asyncio.create_task(cls._cleanup_loop())
    
    @classmethod
    async def _cleanup_loop(cls):
        """Background task to clean up expired files"""
        while True:
            try:
                await cls.cleanup_expired_files()
                await asyncio.sleep(30)  # Run every 30 seconds
            except Exception as e:
                logger.error(f"Cleanup task error: {e}")
    
    @classmethod
    async def save_temp_file(cls, file_content: bytes, filename: str) -> str:
        """
        Save file to temporary storage.
        Returns: temp_file_id (UUID)
        """
        import uuid
        
        temp_id = str(uuid.uuid4())
        temp_path = TEMP_UPLOAD_DIR / f"{temp_id}_{filename}"
        
        # Write file
        async with aiofiles.open(temp_path, "wb") as f:
            await f.write(file_content)
        
        logger.info(f"Saved temp file: {temp_id}")
        return temp_id
    
    @classmethod
    async def get_temp_file(cls, temp_id: str) -> Optional[Path]:
        """
        Retrieve temporary file if it exists and hasn't expired.
        Returns: Path to file or None
        """
        # Find file by temp_id prefix
        matching_files = list(TEMP_UPLOAD_DIR.glob(f"{temp_id}_*"))
        
        if not matching_files:
            return None
        
        file_path = matching_files[0]
        
        # Check if expired
        file_age = time.time() - file_path.stat().st_mtime
        if file_age > TEMP_FILE_TTL:
            # Expired - delete it
            file_path.unlink()
            logger.info(f"Temp file expired: {temp_id}")
            return None
        
        return file_path
    
    @classmethod
    async def delete_temp_file(cls, temp_id: str):
        """Delete temporary file"""
        matching_files = list(TEMP_UPLOAD_DIR.glob(f"{temp_id}_*"))
        for file_path in matching_files:
            file_path.unlink()
            logger.info(f"Deleted temp file: {temp_id}")
    
    @classmethod
    async def cleanup_expired_files(cls):
        """Delete all expired temporary files"""
        current_time = time.time()
        count = 0
        
        for file_path in TEMP_UPLOAD_DIR.iterdir():
            if file_path.is_file():
                file_age = current_time - file_path.stat().st_mtime
                if file_age > TEMP_FILE_TTL:
                    file_path.unlink()
                    count += 1
        
        if count > 0:
            logger.info(f"Cleaned up {count} expired temp files")


# Start cleanup task on module import
asyncio.create_task(TempUploadManager.start_cleanup_task())
```

**Step 8: Update Controller for Guest Uploads**

`backend/app/features/resumes/controller.py`:

```python
from .temp_storage import TempUploadManager

@router.post("/upload/guest")
async def upload_resume_guest(
    file: UploadFile = File(...)
) -> dict:
    """
    Upload resume for guest user (no auth required).
    File stored temporarily for 2 minutes.
    """
    # Security validation
    validation_result = await validate_upload_security(file)
    
    # Read file content
    content = await file.read()
    
    # Save to temporary storage
    temp_id = await TempUploadManager.save_temp_file(content, file.filename)
    
    return {
        "temp_id": temp_id,
        "expires_in": 120,
        "message": "File uploaded. Please log in within 2 minutes to save."
    }


@router.post("/upload/guest/{temp_id}/claim")
async def claim_guest_upload(
    temp_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> UploadResumeResponse:
    """
    Claim a guest upload after authentication.
    Moves file from temp storage to permanent storage.
    """
    # Retrieve temp file
    temp_path = await TempUploadManager.get_temp_file(temp_id)
    
    if not temp_path:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Upload expired or not found. Please upload again."
        )
    
    # Read temp file
    async with aiofiles.open(temp_path, "rb") as f:
        content = await f.read()
    
    # Create UploadFile from temp content
    file = UploadFile(
        filename=temp_path.name.split("_", 1)[1],  # Remove UUID prefix
        file=BytesIO(content)
    )
    
    # Process as authenticated upload
    result = await resume_service.upload_and_parse_resume(
        file=file,
        user_id=current_user.id,
        db=db
    )
    
    # Delete temp file
    await TempUploadManager.delete_temp_file(temp_id)
    
    return UploadResumeResponse(**result)
```

---

### Task 3: UI Login-Registration Behavior Fixes 🔴

**Owner**: Frontend (Netanel)  
**Estimated Time**: 1 day  
**Dependencies**: Task 2 (Database link)

#### Implementation Plan

**Step 1: Fix System Always Opens on Upload Screen**

Update `frontend/src/App.tsx`:

```typescript
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isBootstrapped, isAuthenticated, fetchUser } = useAuthStore();
  
  useEffect(() => {
    // Bootstrap auth on mount
    void fetchUser();
  }, [fetchUser]);
  
  useEffect(() => {
    // Once bootstrapped, handle routing
    if (!isBootstrapped) return;
    
    // If on root and not authenticated, stay on upload screen
    if (location.pathname === '/' && !isAuthenticated) {
      // User is on correct screen (UploadCV for guests)
      return;
    }
    
    // If authenticated and on login/register, redirect to dashboard
    if (isAuthenticated && ['/login', '/register'].includes(location.pathname)) {
      navigate('/dashboard');
    }
  }, [isBootstrapped, isAuthenticated, location.pathname, navigate]);
  
  return <RouterProvider router={router} />;
};
```

**Step 2: Remember State for Guest Uploads**

Create `frontend/src/store/uploadStore.ts`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UploadState {
  tempUploadId: string | null;
  tempUploadExpiry: number | null;
  pendingAuth: boolean;
  
  // Actions
  setTempUpload: (tempId: string, expirySeconds: number) => void;
  clearTempUpload: () => void;
  setPendingAuth: (pending: boolean) => void;
  isUploadExpired: () => boolean;
}

export const useUploadStore = create<UploadState>()(
  persist(
    (set, get) => ({
      tempUploadId: null,
      tempUploadExpiry: null,
      pendingAuth: false,
      
      setTempUpload: (tempId, expirySeconds) => {
        const expiry = Date.now() + (expirySeconds * 1000);
        set({
          tempUploadId: tempId,
          tempUploadExpiry: expiry,
          pendingAuth: true
        });
      },
      
      clearTempUpload: () => {
        set({
          tempUploadId: null,
          tempUploadExpiry: null,
          pendingAuth: false
        });
      },
      
      setPendingAuth: (pending) => set({ pendingAuth: pending }),
      
      isUploadExpired: () => {
        const { tempUploadExpiry } = get();
        if (!tempUploadExpiry) return true;
        return Date.now() > tempUploadExpiry;
      }
    }),
    {
      name: 'portfolio-upload-storage',
      partialize: (state) => ({
        tempUploadId: state.tempUploadId,
        tempUploadExpiry: state.tempUploadExpiry,
        pendingAuth: state.pendingAuth
      })
    }
  )
);
```

**Step 3: Update UploadArea for Guest Flow**

`frontend/src/features/UploadCV/UploadArea/UploadArea.tsx`:

```typescript
import { useAuthStore } from '@/store/authStore';
import { useUploadStore } from '@/store/uploadStore';
import { uploadResumeGuest } from '@/services/uploadService';

export const UploadArea: React.FC<UploadAreaProps> = ({ onUploadComplete }) => {
  const { isAuthenticated } = useAuthStore();
  const { setTempUpload, setPendingAuth } = useUploadStore();
  const navigate = useNavigate();
  
  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    setStatus('validating');

    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      setStatus('error');
      return;
    }

    setStatus('uploading');
    
    try {
      if (isAuthenticated) {
        // Authenticated upload - save directly
        const result = await uploadResume(file, (pct) => setProgress(pct));
        setStatus('success');
        onUploadComplete?.(result);
      } else {
        // Guest upload - save temporarily
        const result = await uploadResumeGuest(file, (pct) => setProgress(pct));
        
        // Store temp upload info
        setTempUpload(result.temp_id, result.expires_in);
        
        setStatus('success');
        
        // Show success message with auth prompt
        toast.success('Upload successful! Log in within 2 minutes to save.');
        
        // Navigate to preview with pending auth flag
        setPendingAuth(true);
        navigate('/preview');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setStatus('error');
    }
  }, [isAuthenticated, onUploadComplete, navigate, setTempUpload, setPendingAuth]);
  
  // ... rest of component
};
```

**Step 4: Add Auth Prompt in Preview**

`frontend/src/features/Preview/PreviewArea/PreviewArea.tsx`:

```typescript
import { useUploadStore } from '@/store/uploadStore';
import { useAuthStore } from '@/store/authStore';

export const PreviewArea: React.FC = () => {
  const { pendingAuth, isUploadExpired, tempUploadId } = useUploadStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(120);
  
  useEffect(() => {
    // Show auth modal if pending auth
    if (pendingAuth && !isAuthenticated) {
      setShowAuthModal(true);
      
      // Start countdown timer
      const interval = setInterval(() => {
        if (isUploadExpired()) {
          clearInterval(interval);
          // Upload expired
          toast.error('Upload expired. Please upload again.');
          navigate('/');
          useUploadStore.getState().clearTempUpload();
        } else {
          // Update countdown
          const expiry = useUploadStore.getState().tempUploadExpiry;
          const remaining = Math.floor((expiry! - Date.now()) / 1000);
          setTimeRemaining(remaining);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [pendingAuth, isAuthenticated, navigate, isUploadExpired]);
  
  const handleNextClick = () => {
    if (pendingAuth && !isAuthenticated) {
      // Show modal
      setShowAuthModal(true);
    } else {
      // Continue to next step
      navigate('/template-selection');
    }
  };
  
  return (
    <>
      <div className="preview-area">
        {/* ... preview content ... */}
        
        <button onClick={handleNextClick} className="preview-area__next">
          Next
        </button>
      </div>
      
      {/* Auth Modal */}
      {showAuthModal && (
        <AuthPromptModal
          timeRemaining={timeRemaining}
          onClose={() => setShowAuthModal(false)}
          onLogin={() => navigate('/login')}
          onRegister={() => navigate('/register')}
        />
      )}
    </>
  );
};
```

**Step 5: Create Auth Prompt Modal**

`frontend/src/components/AuthPromptModal/AuthPromptModal.tsx`:

```typescript
interface AuthPromptModalProps {
  timeRemaining: number;
  onClose: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

export const AuthPromptModal: React.FC<AuthPromptModalProps> = ({
  timeRemaining,
  onClose,
  onLogin,
  onRegister
}) => {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  
  return (
    <div className="auth-prompt-modal">
      <div className="auth-prompt-modal__overlay" onClick={onClose} />
      
      <div className="auth-prompt-modal__content">
        <h2 className="auth-prompt-modal__title">
          Save Your Portfolio
        </h2>
        
        <p className="auth-prompt-modal__message">
          Log in or register to save your portfolio and continue customizing.
        </p>
        
        <div className="auth-prompt-modal__timer">
          <span className="auth-prompt-modal__timer-icon">⏱️</span>
          <span className="auth-prompt-modal__timer-text">
            Time remaining: {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
        
        <div className="auth-prompt-modal__actions">
          <button
            onClick={onRegister}
            className="auth-prompt-modal__button auth-prompt-modal__button--primary"
          >
            Create Account
          </button>
          
          <button
            onClick={onLogin}
            className="auth-prompt-modal__button auth-prompt-modal__button--secondary"
          >
            Log In
          </button>
        </div>
        
        <button
          onClick={onClose}
          className="auth-prompt-modal__close"
          aria-label="Close modal"
        >
          ×
        </button>
      </div>
    </div>
  );
};
```

**Step 6: Fix Error Messages on Login Screen**

Update `frontend/src/features/Auth/Login/Login.tsx`:

```typescript
const handleLogin = async (data: LoginFormData) => {
  setError(null);
  setIsLoading(true);
  
  try {
    await login(data.email, data.password);
    
    // Check if user has pending upload to claim
    const { tempUploadId, pendingAuth } = useUploadStore.getState();
    
    if (pendingAuth && tempUploadId) {
      // Claim guest upload
      try {
        await claimGuestUpload(tempUploadId);
        useUploadStore.getState().clearTempUpload();
        toast.success('Portfolio saved successfully!');
        navigate('/preview');
      } catch (err) {
        toast.error('Failed to save portfolio. Please upload again.');
        navigate('/');
      }
    } else {
      // Normal login - go to dashboard
      navigate('/dashboard');
    }
  } catch (err) {
    // Display user-friendly error message
    const errorMessage = err instanceof Error 
      ? err.message 
      : 'Invalid email or password';
    
    setError(errorMessage);
  } finally {
    setIsLoading(false);
  }
};
```

Update `frontend/src/features/Auth/Login/Login.view.tsx`:

```typescript
{error && (
  <div className="login__error">
    <span className="login__error-icon">⚠️</span>
    <span className="login__error-text">{error}</span>
  </div>
)}
```

Update `frontend/src/features/Auth/Login/Login.styles.scss`:

```scss
.login {
  &__error {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    padding: var(--space-12) var(--space-16);
    background-color: var(--error-light);  // Light pink, not red
    border-left: 3px solid var(--error);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-16);
  }
  
  &__error-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }
  
  &__error-text {
    color: var(--error-dark);  // Dark red text, not bright red
    font-size: var(--font-size-sm);
    line-height: 1.5;
  }
}
```

**Step 7: Improve Password Security (12 characters minimum)**

Update `frontend/src/features/Auth/Registration/Registration.tsx`:

```typescript
import { useForm } from 'react-hook-form';

interface RegistrationFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export const Registration: React.FC = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm<RegistrationFormData>({
    mode: 'onChange'  // Validate on change for real-time feedback
  });
  
  const password = watch('password');
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* ... email field ... */}
      
      <div className="registration__field">
        <label htmlFor="password" className="registration__label">
          Password
        </label>
        
        <input
          id="password"
          type="password"
          className={`registration__input ${
            errors.password ? 'registration__input--error' : ''
          } ${
            password && password.length >= 12 && !errors.password 
              ? 'registration__input--valid' 
              : ''
          }`}
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 12,
              message: 'Password must be at least 12 characters'
            },
            pattern: {
              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
              message: 'Password must include uppercase, lowercase, number, and special character'
            }
          })}
        />
        
        {errors.password && (
          <span className="registration__error">
            {errors.password.message}
          </span>
        )}
        
        {password && password.length >= 12 && !errors.password && (
          <span className="registration__success">
            ✓ Password is strong
          </span>
        )}
      </div>
      
      {/* ... confirm password field ... */}
      
      <button
        type="submit"
        className="registration__submit"
        disabled={!isValid || isLoading}
      >
        Create Account
      </button>
    </form>
  );
};
```

Update `frontend/src/features/Auth/Registration/Registration.styles.scss`:

```scss
.registration {
  &__input {
    width: 100%;
    padding: var(--space-12) var(--space-16);
    border: 2px solid var(--border-default);
    border-radius: var(--radius-md);
    font-size: var(--font-size-base);
    transition: all 0.2s ease;
    
    &:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-light);
    }
    
    // Error state (red background)
    &--error {
      border-color: var(--error);
      background-color: var(--error-light);
      
      &:focus {
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
      }
    }
    
    // Valid state (remove red background when corrected)
    &--valid {
      border-color: var(--success);
      background-color: var(--surface-primary);  // Reset to white
      
      &:focus {
        box-shadow: 0 0 0 3px var(--success-light);
      }
    }
  }
  
  &__error {
    display: block;
    margin-top: var(--space-4);
    color: var(--error);
    font-size: var(--font-size-sm);
  }
  
  &__success {
    display: block;
    margin-top: var(--space-4);
    color: var(--success);
    font-size: var(--font-size-sm);
  }
}
```

---

## P1: Core Features

### Task 4: Portfolio Dashboard Screen 🟠

**Owner**: Frontend (Netanel)  
**Estimated Time**: 3-4 days  
**Dependencies**: Task 2 (Database link), Task 6 (User Dashboard API)

#### Architecture Overview

Based on the uploaded designs, the Portfolio Dashboard needs:

1. **Settings Sidebar** (left panel)
   - Profile section with avatar/name
   - Navigation links (Profile, Settings)
   - Help section
   - Save button

2. **Customization Toolbar** (top)
   - Style dropdown (Style 1, 2, 3)
   - Color picker dropdown
   - Typography dropdown (fonts)
   - Edit/Display mode toggle

3. **Portfolio Preview** (center)
   - Live preview of portfolio with current settings
   - Responsive to customization changes

4. **Display Mode**
   - Full-screen portfolio view
   - Exit to edit mode

#### Implementation Plan

**Step 1: Create Dashboard Store**

`frontend/src/store/dashboardStore.ts`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Color palette options
export const COLOR_PALETTES = {
  white: { primary: '#FFFFFF', secondary: '#F3F4F6', accent: '#34C759' },
  black: { primary: '#1F2937', secondary: '#111827', accent: '#3B82F6' },
  red: { primary: '#EF4444', secondary: '#FEE2E2', accent: '#DC2626' },
  blue: { primary: '#3B82F6', secondary: '#DBEAFE', accent: '#2563EB' },
  yellow: { primary: '#FBBF24', secondary: '#FEF3C7', accent: '#F59E0B' },
  green: { primary: '#10B981', secondary: '#D1FAE5', accent: '#059669' },
  orange: { primary: '#F97316', secondary: '#FFEDD5', accent: '#EA580C' },
  pink: { primary: '#EC4899', secondary: '#FCE7F3', accent: '#DB2777' },
  purple: { primary: '#A855F7', secondary: '#F3E8FF', accent: '#9333EA' }
} as const;

export type ColorPalette = keyof typeof COLOR_PALETTES;

// Style options
export const STYLE_OPTIONS = ['style-1', 'style-2', 'style-3'] as const;
export type StyleOption = typeof STYLE_OPTIONS[number];

// Typography options
export const TYPOGRAPHY_OPTIONS = {
  'Inter': { family: 'Inter, sans-serif', weights: [400, 500, 600, 700] },
  'Roboto': { family: 'Roboto, sans-serif', weights: [400, 500, 700] },
  'Open Sans': { family: 'Open Sans, sans-serif', weights: [400, 600, 700] },
  'Montserrat': { family: 'Montserrat, sans-serif', weights: [400, 500, 600, 700] },
  'Playfair Display': { family: 'Playfair Display, serif', weights: [400, 700] },
  'Merriweather': { family: 'Merriweather, serif', weights: [400, 700] },
  'Lora': { family: 'Lora, serif', weights: [400, 600, 700] }
} as const;

export type TypographyOption = keyof typeof TYPOGRAPHY_OPTIONS;

// View modes
export type ViewMode = 'edit' | 'display';

interface DashboardState {
  // Current settings
  colorPalette: ColorPalette;
  styleOption: StyleOption;
  typography: TypographyOption;
  viewMode: ViewMode;
  
  // Unsaved changes flag
  hasUnsavedChanges: boolean;
  
  // Actions
  setColorPalette: (palette: ColorPalette) => void;
  setStyleOption: (style: StyleOption) => void;
  setTypography: (font: TypographyOption) => void;
  setViewMode: (mode: ViewMode) => void;
  saveSettings: () => Promise<void>;
  resetSettings: () => void;
  markDirty: () => void;
  markClean: () => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      // Default settings
      colorPalette: 'white',
      styleOption: 'style-1',
      typography: 'Inter',
      viewMode: 'edit',
      hasUnsavedChanges: false,
      
      setColorPalette: (palette) => {
        set({ colorPalette: palette, hasUnsavedChanges: true });
      },
      
      setStyleOption: (style) => {
        set({ styleOption: style, hasUnsavedChanges: true });
      },
      
      setTypography: (font) => {
        set({ typography: font, hasUnsavedChanges: true });
      },
      
      setViewMode: (mode) => {
        set({ viewMode: mode });
      },
      
      saveSettings: async () => {
        const state = get();
        
        try {
          // API call to save settings
          await api.post('/portfolios/settings', {
            color_palette: state.colorPalette,
            style_option: state.styleOption,
            typography: state.typography
          });
          
          set({ hasUnsavedChanges: false });
          toast.success('Settings saved successfully');
        } catch (error) {
          toast.error('Failed to save settings');
          throw error;
        }
      },
      
      resetSettings: () => {
        set({
          colorPalette: 'white',
          styleOption: 'style-1',
          typography: 'Inter',
          hasUnsavedChanges: false
        });
      },
      
      markDirty: () => set({ hasUnsavedChanges: true }),
      markClean: () => set({ hasUnsavedChanges: false })
    }),
    {
      name: 'portfolio-dashboard-settings',
      partialize: (state) => ({
        colorPalette: state.colorPalette,
        styleOption: state.styleOption,
        typography: state.typography
      })
    }
  )
);
```

**Step 2: Create Dashboard Component Structure**

```
frontend/src/features/Dashboard/
├── Dashboard.tsx                    # Main container (logic)
├── Dashboard.view.tsx               # Main layout (view)
├── Dashboard.styles.scss            # Main styles
├── Dashboard.types.ts               # Shared types
│
├── SettingsSidebar/
│   ├── SettingsSidebar.tsx
│   ├── SettingsSidebar.view.tsx
│   ├── SettingsSidebar.styles.scss
│   └── SettingsSidebar.types.ts
│
├── CustomizationToolbar/
│   ├── CustomizationToolbar.tsx
│   ├── CustomizationToolbar.view.tsx
│   ├── CustomizationToolbar.styles.scss
│   └── CustomizationToolbar.types.ts
│
├── PortfolioPreview/
│   ├── PortfolioPreview.tsx
│   ├── PortfolioPreview.view.tsx
│   ├── PortfolioPreview.styles.scss
│   └── PortfolioPreview.types.ts
│
└── index.ts
```

**Step 3: Implement Main Dashboard Container**

`frontend/src/features/Dashboard/Dashboard.tsx`:

```typescript
import { useState, useCallback, useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { useAuthStore } from '@/store/authStore';
import { DashboardView } from './Dashboard.view';
import type { DashboardProps } from './Dashboard.types';

export const Dashboard: React.FC<DashboardProps> = () => {
  const { user } = useAuthStore();
  const {
    colorPalette,
    styleOption,
    typography,
    viewMode,
    hasUnsavedChanges,
    setColorPalette,
    setStyleOption,
    setTypography,
    setViewMode,
    saveSettings
  } = useDashboardStore();
  
  const [isSaving, setIsSaving] = useState(false);
  
  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);
  
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await saveSettings();
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  }, [saveSettings]);
  
  const handleColorChange = useCallback((color: ColorPalette) => {
    setColorPalette(color);
  }, [setColorPalette]);
  
  const handleStyleChange = useCallback((style: StyleOption) => {
    setStyleOption(style);
  }, [setStyleOption]);
  
  const handleTypographyChange = useCallback((font: TypographyOption) => {
    setTypography(font);
  }, [setTypography]);
  
  const handleModeToggle = useCallback(() => {
    setViewMode(viewMode === 'edit' ? 'display' : 'edit');
  }, [viewMode, setViewMode]);
  
  return (
    <DashboardView
      user={user}
      colorPalette={colorPalette}
      styleOption={styleOption}
      typography={typography}
      viewMode={viewMode}
      hasUnsavedChanges={hasUnsavedChanges}
      isSaving={isSaving}
      onColorChange={handleColorChange}
      onStyleChange={handleStyleChange}
      onTypographyChange={handleTypographyChange}
      onModeToggle={handleModeToggle}
      onSave={handleSave}
    />
  );
};
```

`frontend/src/features/Dashboard/Dashboard.view.tsx`:

```typescript
import { SettingsSidebar } from './SettingsSidebar/SettingsSidebar';
import { CustomizationToolbar } from './CustomizationToolbar/CustomizationToolbar';
import { PortfolioPreview } from './PortfolioPreview/PortfolioPreview';
import type { DashboardViewProps } from './Dashboard.types';
import './Dashboard.styles.scss';

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  colorPalette,
  styleOption,
  typography,
  viewMode,
  hasUnsavedChanges,
  isSaving,
  onColorChange,
  onStyleChange,
  onTypographyChange,
  onModeToggle,
  onSave
}) => (
  <div className="dashboard" data-mode={viewMode}>
    {viewMode === 'edit' && (
      <>
        <SettingsSidebar
          user={user}
          hasUnsavedChanges={hasUnsavedChanges}
          isSaving={isSaving}
          onSave={onSave}
        />
        
        <CustomizationToolbar
          colorPalette={colorPalette}
          styleOption={styleOption}
          typography={typography}
          onColorChange={onColorChange}
          onStyleChange={onStyleChange}
          onTypographyChange={onTypographyChange}
          onModeToggle={onModeToggle}
        />
      </>
    )}
    
    <PortfolioPreview
      colorPalette={colorPalette}
      styleOption={styleOption}
      typography={typography}
      viewMode={viewMode}
      onModeToggle={onModeToggle}
    />
  </div>
);
```

`frontend/src/features/Dashboard/Dashboard.styles.scss`:

```scss
@use '../../styles/tokens/colors' as colors;
@use '../../styles/tokens/spacing' as spacing;
@use '../../styles/mixins/responsive' as responsive;

.dashboard {
  display: grid;
  grid-template-areas:
    "sidebar toolbar"
    "sidebar preview";
  grid-template-columns: 280px 1fr;
  grid-template-rows: auto 1fr;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(
    180deg,
    rgba(255, 192, 203, 0.3) 0%,
    rgba(173, 216, 230, 0.3) 50%,
    rgba(135, 206, 250, 0.5) 100%
  );
  
  &[data-mode="display"] {
    grid-template-areas: "preview";
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
  }
  
  @include responsive.mq('tablet-down') {
    grid-template-areas:
      "toolbar"
      "preview"
      "sidebar";
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
  }
}
```

**Step 4: Implement Settings Sidebar**

`frontend/src/features/Dashboard/SettingsSidebar/SettingsSidebar.view.tsx`:

```typescript
import type { SettingsSidebarViewProps } from './SettingsSidebar.types';
import './SettingsSidebar.styles.scss';

export const SettingsSidebarView: React.FC<SettingsSidebarViewProps> = ({
  user,
  hasUnsavedChanges,
  isSaving,
  onSave,
  onProfileClick,
  onSettingsClick,
  onHelpClick
}) => (
  <aside className="settings-sidebar">
    {/* User Profile Section */}
    <div className="settings-sidebar__profile">
      <div className="settings-sidebar__avatar">
        <span className="settings-sidebar__initials">
          {user?.name?.substring(0, 2).toUpperCase() || 'YM'}
        </span>
      </div>
      
      <div className="settings-sidebar__user-info">
        <h3 className="settings-sidebar__name">
          {user?.name || 'Yoad Madmoni'}
        </h3>
        <p className="settings-sidebar__role">
          Basic
        </p>
      </div>
    </div>
    
    {/* Navigation Links */}
    <nav className="settings-sidebar__nav">
      <button
        onClick={onProfileClick}
        className="settings-sidebar__link"
      >
        <span className="settings-sidebar__icon">👤</span>
        <span className="settings-sidebar__text">Profile</span>
      </button>
      
      <button
        onClick={onSettingsClick}
        className="settings-sidebar__link"
      >
        <span className="settings-sidebar__icon">⚙️</span>
        <span className="settings-sidebar__text">Settings</span>
      </button>
    </nav>
    
    {/* Help Section */}
    <div className="settings-sidebar__help">
      <button
        onClick={onHelpClick}
        className="settings-sidebar__help-button"
      >
        Need Help?
      </button>
    </div>
    
    {/* Save Button */}
    <div className="settings-sidebar__actions">
      <button
        onClick={onSave}
        disabled={!hasUnsavedChanges || isSaving}
        className={`settings-sidebar__save ${
          hasUnsavedChanges ? 'settings-sidebar__save--active' : ''
        }`}
      >
        {isSaving ? 'Saving...' : 'Save'}
      </button>
      
      {hasUnsavedChanges && (
        <span className="settings-sidebar__unsaved-indicator">
          Unsaved changes
        </span>
      )}
    </div>
  </aside>
);
```

`frontend/src/features/Dashboard/SettingsSidebar/SettingsSidebar.styles.scss`:

```scss
@use '../../../styles/tokens/colors' as colors;
@use '../../../styles/tokens/spacing' as spacing;
@use '../../../styles/tokens/radii' as radii;

.settings-sidebar {
  grid-area: sidebar;
  display: flex;
  flex-direction: column;
  gap: spacing.$lg;
  padding: spacing.$xl;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  
  &__profile {
    display: flex;
    align-items: center;
    gap: spacing.$md;
    padding: spacing.$md;
    background: rgba(255, 255, 255, 0.6);
    border-radius: radii.$lg;
  }
  
  &__avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  &__initials {
    color: white;
    font-weight: 600;
    font-size: var(--font-size-lg);
  }
  
  &__user-info {
    flex: 1;
  }
  
  &__name {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 spacing.$xs 0;
  }
  
  &__role {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin: 0;
  }
  
  &__nav {
    display: flex;
    flex-direction: column;
    gap: spacing.$sm;
  }
  
  &__link {
    display: flex;
    align-items: center;
    gap: spacing.$md;
    padding: spacing.$md;
    background: transparent;
    border: none;
    border-radius: radii.$md;
    cursor: pointer;
    transition: background 0.2s ease;
    text-align: left;
    
    &:hover {
      background: rgba(255, 255, 255, 0.5);
    }
  }
  
  &__icon {
    font-size: 1.25rem;
  }
  
  &__text {
    font-size: var(--font-size-base);
    color: var(--text-primary);
  }
  
  &__help {
    margin-top: auto;
  }
  
  &__help-button {
    width: 100%;
    padding: spacing.$md;
    background: transparent;
    border: 1px solid var(--primary);
    color: var(--primary);
    border-radius: radii.$md;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: var(--primary);
      color: white;
    }
  }
  
  &__actions {
    display: flex;
    flex-direction: column;
    gap: spacing.$xs;
  }
  
  &__save {
    width: 100%;
    padding: spacing.$md;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: radii.$md;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    &--active {
      animation: pulse 2s infinite;
    }
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3);
    }
  }
  
  &__unsaved-indicator {
    font-size: var(--font-size-sm);
    color: var(--warning);
    text-align: center;
  }
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(52, 199, 89, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(52, 199, 89, 0);
  }
}
```

**Step 5: Implement Customization Toolbar**

`frontend/src/features/Dashboard/CustomizationToolbar/CustomizationToolbar.view.tsx`:

```typescript
import { COLOR_PALETTES, STYLE_OPTIONS, TYPOGRAPHY_OPTIONS } from '@/store/dashboardStore';
import type { CustomizationToolbarViewProps } from './CustomizationToolbar.types';
import './CustomizationToolbar.styles.scss';

export const CustomizationToolbarView: React.FC<CustomizationToolbarViewProps> = ({
  colorPalette,
  styleOption,
  typography,
  showColorPicker,
  showStylePicker,
  showTypographyPicker,
  onColorChange,
  onStyleChange,
  onTypographyChange,
  onToggleColorPicker,
  onToggleStylePicker,
  onToggleTypographyPicker,
  onModeToggle
}) => (
  <div className="customization-toolbar">
    {/* Undo/Redo Buttons */}
    <div className="customization-toolbar__history">
      <button className="customization-toolbar__button" aria-label="Undo">
        <span className="customization-toolbar__icon">↶</span>
      </button>
      <button className="customization-toolbar__button" aria-label="Redo">
        <span className="customization-toolbar__icon">↷</span>
      </button>
    </div>
    
    {/* Style Picker */}
    <div className="customization-toolbar__section">
      <button
        onClick={onToggleStylePicker}
        className="customization-toolbar__dropdown"
      >
        <span>Style</span>
        <span className="customization-toolbar__dropdown-arrow">▼</span>
      </button>
      
      {showStylePicker && (
        <div className="customization-toolbar__menu">
          {STYLE_OPTIONS.map((style) => (
            <button
              key={style}
              onClick={() => {
                onStyleChange(style);
                onToggleStylePicker();
              }}
              className={`customization-toolbar__menu-item ${
                styleOption === style ? 'customization-toolbar__menu-item--active' : ''
              }`}
            >
              {style.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      )}
    </div>
    
    {/* Color Picker */}
    <div className="customization-toolbar__section">
      <button
        onClick={onToggleColorPicker}
        className="customization-toolbar__dropdown"
      >
        <span>Color</span>
        <span className="customization-toolbar__dropdown-arrow">▼</span>
      </button>
      
      {showColorPicker && (
        <div className="customization-toolbar__menu customization-toolbar__menu--colors">
          {(Object.keys(COLOR_PALETTES) as Array<keyof typeof COLOR_PALETTES>).map((color) => (
            <button
              key={color}
              onClick={() => {
                onColorChange(color);
                onToggleColorPicker();
              }}
              className={`customization-toolbar__color-swatch ${
                colorPalette === color ? 'customization-toolbar__color-swatch--active' : ''
              }`}
              style={{ backgroundColor: COLOR_PALETTES[color].primary }}
              aria-label={color}
            >
              {colorPalette === color && (
                <span className="customization-toolbar__check">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
    
    {/* Typography Picker */}
    <div className="customization-toolbar__section">
      <button
        onClick={onToggleTypographyPicker}
        className="customization-toolbar__dropdown"
      >
        <span>Typographic</span>
        <span className="customization-toolbar__dropdown-arrow">▼</span>
      </button>
      
      {showTypographyPicker && (
        <div className="customization-toolbar__menu">
          {(Object.keys(TYPOGRAPHY_OPTIONS) as Array<keyof typeof TYPOGRAPHY_OPTIONS>).map((font) => (
            <button
              key={font}
              onClick={() => {
                onTypographyChange(font);
                onToggleTypographyPicker();
              }}
              className={`customization-toolbar__menu-item ${
                typography === font ? 'customization-toolbar__menu-item--active' : ''
              }`}
              style={{ fontFamily: TYPOGRAPHY_OPTIONS[font].family }}
            >
              {font}
            </button>
          ))}
        </div>
      )}
    </div>
    
    {/* Mode Toggle */}
    <div className="customization-toolbar__actions">
      <button
        onClick={onModeToggle}
        className="customization-toolbar__mode-toggle customization-toolbar__mode-toggle--edit"
      >
        Edit
      </button>
      <button
        onClick={onModeToggle}
        className="customization-toolbar__mode-toggle customization-toolbar__mode-toggle--display"
      >
        Display
      </button>
    </div>
  </div>
);
```

`frontend/src/features/Dashboard/CustomizationToolbar/CustomizationToolbar.styles.scss`:

```scss
@use '../../../styles/tokens/colors' as colors;
@use '../../../styles/tokens/spacing' as spacing;
@use '../../../styles/tokens/radii' as radii;
@use '../../../styles/tokens/shadows' as shadows;

.customization-toolbar {
  grid-area: toolbar;
  display: flex;
  align-items: center;
  gap: spacing.$lg;
  padding: spacing.$md spacing.$xl;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  
  &__history {
    display: flex;
    gap: spacing.$xs;
  }
  
  &__button {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: radii.$md;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: var(--surface-hover);
      transform: translateY(-2px);
    }
  }
  
  &__icon {
    font-size: 1.25rem;
  }
  
  &__section {
    position: relative;
  }
  
  &__dropdown {
    display: flex;
    align-items: center;
    gap: spacing.$sm;
    padding: spacing.$sm spacing.$md;
    background: white;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: radii.$md;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: var(--font-size-sm);
    
    &:hover {
      background: var(--surface-hover);
    }
  }
  
  &__dropdown-arrow {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
  
  &__menu {
    position: absolute;
    top: calc(100% + spacing.$xs);
    left: 0;
    min-width: 200px;
    background: white;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: radii.$md;
    box-shadow: shadows.$lg;
    padding: spacing.$xs;
    z-index: 10;
    
    &--colors {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: spacing.$xs;
      min-width: 160px;
    }
  }
  
  &__menu-item {
    width: 100%;
    padding: spacing.$sm spacing.$md;
    text-align: left;
    background: transparent;
    border: none;
    border-radius: radii.$sm;
    cursor: pointer;
    transition: background 0.2s ease;
    
    &:hover {
      background: var(--surface-hover);
    }
    
    &--active {
      background: var(--primary-light);
      color: var(--primary);
      font-weight: 600;
    }
  }
  
  &__color-swatch {
    width: 48px;
    height: 48px;
    border: 2px solid transparent;
    border-radius: radii.$md;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    
    &:hover {
      transform: scale(1.1);
    }
    
    &--active {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(52, 199, 89, 0.2);
    }
  }
  
  &__check {
    color: white;
    font-size: 1.25rem;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }
  
  &__actions {
    margin-left: auto;
    display: flex;
    gap: spacing.$xs;
  }
  
  &__mode-toggle {
    padding: spacing.$sm spacing.$lg;
    border: none;
    border-radius: radii.$md;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
    
    &--edit {
      background: var(--primary);
      color: white;
      
      &:hover {
        background: var(--primary-dark);
      }
    }
    
    &--display {
      background: white;
      color: var(--text-primary);
      border: 1px solid rgba(0, 0, 0, 0.1);
      
      &:hover {
        background: var(--surface-hover);
      }
    }
  }
}
```

**Step 6: Implement Portfolio Preview**

`frontend/src/features/Dashboard/PortfolioPreview/PortfolioPreview.tsx`:

```typescript
import { useMemo } from 'react';
import { COLOR_PALETTES, TYPOGRAPHY_OPTIONS } from '@/store/dashboardStore';
import { PortfolioPreviewView } from './PortfolioPreview.view';
import type { PortfolioPreviewProps } from './PortfolioPreview.types';

export const PortfolioPreview: React.FC<PortfolioPreviewProps> = ({
  colorPalette,
  styleOption,
  typography,
  viewMode,
  onModeToggle
}) => {
  // Generate CSS variables from current settings
  const cssVariables = useMemo(() => {
    const colors = COLOR_PALETTES[colorPalette];
    const fonts = TYPOGRAPHY_OPTIONS[typography];
    
    return {
      '--portfolio-primary': colors.primary,
      '--portfolio-secondary': colors.secondary,
      '--portfolio-accent': colors.accent,
      '--portfolio-font-family': fonts.family
    } as React.CSSProperties;
  }, [colorPalette, typography]);
  
  return (
    <PortfolioPreviewView
      styleOption={styleOption}
      cssVariables={cssVariables}
      viewMode={viewMode}
      onModeToggle={onModeToggle}
    />
  );
};
```

`frontend/src/features/Dashboard/PortfolioPreview/PortfolioPreview.view.tsx`:

```typescript
import type { PortfolioPreviewViewProps } from './PortfolioPreview.types';
import './PortfolioPreview.styles.scss';

export const PortfolioPreviewView: React.FC<PortfolioPreviewViewProps> = ({
  styleOption,
  cssVariables,
  viewMode,
  onModeToggle
}) => (
  <div className="portfolio-preview" data-mode={viewMode}>
    {viewMode === 'display' && (
      <button
        onClick={onModeToggle}
        className="portfolio-preview__exit"
        aria-label="Exit display mode"
      >
        × Exit
      </button>
    )}
    
    <div
      className="portfolio-preview__content"
      data-style={styleOption}
      style={cssVariables}
    >
      {/* Portfolio content based on uploaded resume */}
      <div className="portfolio-preview__frame">
        {/* This will be populated with actual portfolio sections */}
        <div className="portfolio-preview__placeholder">
          Portfolio Preview
          <p>Style: {styleOption}</p>
          <p>Your customized portfolio will appear here</p>
        </div>
      </div>
    </div>
  </div>
);
```

`frontend/src/features/Dashboard/PortfolioPreview/PortfolioPreview.styles.scss`:

```scss
@use '../../../styles/tokens/colors' as colors;
@use '../../../styles/tokens/spacing' as spacing;
@use '../../../styles/tokens/radii' as radii;

.portfolio-preview {
  grid-area: preview;
  position: relative;
  overflow: auto;
  padding: spacing.$xl;
  
  &[data-mode="display"] {
    padding: 0;
  }
  
  &__exit {
    position: fixed;
    top: spacing.$lg;
    right: spacing.$lg;
    padding: spacing.$sm spacing.$lg;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    border-radius: radii.$full;
    font-size: var(--font-size-lg);
    cursor: pointer;
    z-index: 100;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(0, 0, 0, 0.9);
      transform: scale(1.05);
    }
  }
  
  &__content {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    background: white;
    border-radius: radii.$xl;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    
    [data-mode="display"] & {
      max-width: 100%;
      border-radius: 0;
      box-shadow: none;
    }
  }
  
  &__frame {
    padding: spacing.$xl;
    font-family: var(--portfolio-font-family);
    
    // Apply color scheme
    background-color: var(--portfolio-secondary);
    color: var(--portfolio-primary);
  }
  
  &__placeholder {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--text-secondary);
  }
}
```

**Step 7: Testing Checklist**
- [ ] Color palette changes update preview in real-time
- [ ] Style option changes update preview layout
- [ ] Typography changes update preview fonts
- [ ] Display mode hides sidebar and toolbar
- [ ] Display mode exit button works
- [ ] Unsaved changes indicator appears
- [ ] Save button works and shows loading state
- [ ] Browser warns before leaving with unsaved changes
- [ ] Settings persist across page reloads

---

### Task 5: Portfolio Versioning System 🟠

**Owner**: Backend (Israel, Ido, Yarin)  
**Estimated Time**: 2 days  
**Dependencies**: Task 4 (Portfolio Dashboard)

#### Implementation Plan

**Step 1: Create Versions Table Migration**

```bash
docker compose exec backend alembic revision -m "add_portfolio_versions"
```

`backend/app/alembic/versions/XXXX_add_portfolio_versions.py`:

```python
"""add_portfolio_versions

Revision ID: XXXX
Revises: YYYY
Create Date: 2025-11-22
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers
revision = 'XXXX'
down_revision = 'YYYY'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create portfolio_versions table
    op.create_table(
        'portfolio_versions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('portfolio_id', sa.Integer(), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('content', JSONB, nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('change_description', sa.String(500), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(
            ['portfolio_id'],
            ['portfolios.id'],
            name='fk_versions_portfolio_id',
            ondelete='CASCADE'
        ),
        sa.ForeignKeyConstraint(
            ['created_by'],
            ['users.id'],
            name='fk_versions_created_by'
        )
    )
    
    # Create indexes for performance
    op.create_index(
        'ix_portfolio_versions_portfolio_id',
        'portfolio_versions',
        ['portfolio_id']
    )
    op.create_index(
        'ix_portfolio_versions_version_number',
        'portfolio_versions',
        ['portfolio_id', 'version_number'],
        unique=True
    )
    op.create_index(
        'ix_portfolio_versions_created_at',
        'portfolio_versions',
        ['created_at']
    )


def downgrade() -> None:
    op.drop_index('ix_portfolio_versions_created_at', table_name='portfolio_versions')
    op.drop_index('ix_portfolio_versions_version_number', table_name='portfolio_versions')
    op.drop_index('ix_portfolio_versions_portfolio_id', table_name='portfolio_versions')
    op.drop_table('portfolio_versions')
```

**Step 2: Create PortfolioVersion Model**

`backend/app/features/portfolios/models.py`:

```python
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.shared.database import Base

class PortfolioVersion(Base):
    __tablename__ = "portfolio_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(
        Integer,
        ForeignKey("portfolios.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    version_number = Column(Integer, nullable=False)
    content = Column(JSONB, nullable=False)  # Full snapshot of portfolio data
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    change_description = Column(String(500), nullable=True)
    
    # Relationships
    portfolio = relationship("Portfolio", back_populates="versions")
    creator = relationship("User")
    
    # Composite unique constraint
    __table_args__ = (
        Index(
            'ix_portfolio_versions_unique',
            'portfolio_id',
            'version_number',
            unique=True
        ),
    )


class Portfolio(Base):
    __tablename__ = "portfolios"
    
    # ... existing fields ...
    
    # Add relationship to versions
    versions = relationship(
        "PortfolioVersion",
        back_populates="portfolio",
        cascade="all, delete-orphan",
        order_by="PortfolioVersion.version_number.desc()"
    )
```

**Step 3: Create Version Service**

`backend/app/features/portfolios/version_service.py`:

```python
"""
Portfolio versioning service.
Handles version creation, retrieval, and rollback.
"""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from .models import Portfolio, PortfolioVersion
import logging

logger = logging.getLogger(__name__)

MAX_VERSIONS_PER_PORTFOLIO = 10


async def create_version(
    portfolio_id: int,
    content: dict,
    user_id: int,
    change_description: Optional[str],
    db: AsyncSession
) -> PortfolioVersion:
    """
    Create a new version snapshot of a portfolio.
    Automatically manages version numbering and enforces version limit.
    
    Args:
        portfolio_id: ID of the portfolio
        content: Complete portfolio data (JSONB)
        user_id: ID of user making the change
        change_description: Optional description of changes
        db: Database session
        
    Returns:
        Created PortfolioVersion instance
    """
    # Get current max version number
    stmt = select(func.max(PortfolioVersion.version_number)).where(
        PortfolioVersion.portfolio_id == portfolio_id
    )
    result = await db.execute(stmt)
    max_version = result.scalar() or 0
    
    # Create new version
    new_version = PortfolioVersion(
        portfolio_id=portfolio_id,
        version_number=max_version + 1,
        content=content,
        created_by=user_id,
        change_description=change_description
    )
    
    db.add(new_version)
    await db.flush()  # Get version ID without committing
    
    # Enforce version limit - keep only last N versions
    await enforce_version_limit(portfolio_id, db)
    
    await db.commit()
    await db.refresh(new_version)
    
    logger.info(f"Created version {new_version.version_number} for portfolio {portfolio_id}")
    
    return new_version


async def enforce_version_limit(portfolio_id: int, db: AsyncSession):
    """
    Delete oldest versions if limit exceeded.
    Keeps the most recent MAX_VERSIONS_PER_PORTFOLIO versions.
    """
    # Count total versions
    stmt = select(func.count(PortfolioVersion.id)).where(
        PortfolioVersion.portfolio_id == portfolio_id
    )
    result = await db.execute(stmt)
    total_versions = result.scalar()
    
    if total_versions <= MAX_VERSIONS_PER_PORTFOLIO:
        return  # Within limit
    
    # Delete oldest versions
    versions_to_delete = total_versions - MAX_VERSIONS_PER_PORTFOLIO
    
    # Get IDs of oldest versions
    stmt = (
        select(PortfolioVersion.id)
        .where(PortfolioVersion.portfolio_id == portfolio_id)
        .order_by(PortfolioVersion.version_number)
        .limit(versions_to_delete)
    )
    result = await db.execute(stmt)
    ids_to_delete = [row[0] for row in result.fetchall()]
    
    # Delete old versions
    if ids_to_delete:
        stmt = delete(PortfolioVersion).where(
            PortfolioVersion.id.in_(ids_to_delete)
        )
        await db.execute(stmt)
        logger.info(f"Deleted {len(ids_to_delete)} old versions for portfolio {portfolio_id}")


async def get_version_history(
    portfolio_id: int,
    limit: int = 10,
    db: AsyncSession
) -> list[PortfolioVersion]:
    """
    Get version history for a portfolio.
    Returns versions in reverse chronological order (newest first).
    
    Args:
        portfolio_id: ID of the portfolio
        limit: Maximum number of versions to return
        db: Database session
        
    Returns:
        List of PortfolioVersion instances
    """
    stmt = (
        select(PortfolioVersion)
        .where(PortfolioVersion.portfolio_id == portfolio_id)
        .options(selectinload(PortfolioVersion.creator))
        .order_by(desc(PortfolioVersion.version_number))
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


async def get_version(
    portfolio_id: int,
    version_number: int,
    db: AsyncSession
) -> Optional[PortfolioVersion]:
    """
    Get a specific version of a portfolio.
    
    Args:
        portfolio_id: ID of the portfolio
        version_number: Version number to retrieve
        db: Database session
        
    Returns:
        PortfolioVersion instance or None if not found
    """
    stmt = (
        select(PortfolioVersion)
        .where(
            PortfolioVersion.portfolio_id == portfolio_id,
            PortfolioVersion.version_number == version_number
        )
        .options(selectinload(PortfolioVersion.creator))
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def rollback_to_version(
    portfolio_id: int,
    version_number: int,
    user_id: int,
    db: AsyncSession
) -> Portfolio:
    """
    Rollback portfolio to a previous version.
    Creates a new version with the old content.
    
    Args:
        portfolio_id: ID of the portfolio
        version_number: Version number to rollback to
        user_id: ID of user performing rollback
        db: Database session
        
    Returns:
        Updated Portfolio instance
        
    Raises:
        ValueError: If version not found
    """
    # Get the version to rollback to
    target_version = await get_version(portfolio_id, version_number, db)
    
    if not target_version:
        raise ValueError(f"Version {version_number} not found for portfolio {portfolio_id}")
    
    # Get current portfolio
    stmt = select(Portfolio).where(Portfolio.id == portfolio_id)
    result = await db.execute(stmt)
    portfolio = result.scalar_one()
    
    # Update portfolio with old content
    portfolio.content = target_version.content
    portfolio.updated_at = func.now()
    
    # Create a new version for the rollback
    await create_version(
        portfolio_id=portfolio_id,
        content=target_version.content,
        user_id=user_id,
        change_description=f"Rolled back to version {version_number}",
        db=db
    )
    
    await db.commit()
    await db.refresh(portfolio)
    
    logger.info(f"Rolled back portfolio {portfolio_id} to version {version_number}")
    
    return portfolio
```

**Step 4: Update Portfolio Controller with Versioning**

`backend/app/features/portfolios/controller.py`:

```python
from .version_service import create_version, get_version_history, rollback_to_version

@router.put("/{portfolio_id}")
async def update_portfolio(
    portfolio_id: int,
    data: PortfolioUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> PortfolioResponse:
    """
    Update portfolio and create version snapshot.
    """
    # Verify ownership
    portfolio = await verify_portfolio_ownership(portfolio_id, current_user.id, db)
    
    # Create version BEFORE updating
    await create_version(
        portfolio_id=portfolio.id,
        content=portfolio.content,
        user_id=current_user.id,
        change_description=data.change_description,
        db=db
    )
    
    # Update portfolio
    portfolio.content = data.content
    portfolio.updated_at = func.now()
    
    await db.commit()
    await db.refresh(portfolio)
    
    return PortfolioResponse.from_orm(portfolio)


@router.get("/{portfolio_id}/versions")
async def get_portfolio_versions(
    portfolio_id: int,
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> list[VersionResponse]:
    """
    Get version history for a portfolio.
    """
    # Verify ownership
    await verify_portfolio_ownership(portfolio_id, current_user.id, db)
    
    versions = await get_version_history(portfolio_id, limit, db)
    
    return [VersionResponse.from_orm(v) for v in versions]


@router.post("/{portfolio_id}/rollback")
async def rollback_portfolio(
    portfolio_id: int,
    version_number: int = Body(..., embed=True),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> PortfolioResponse:
    """
    Rollback portfolio to a previous version.
    """
    # Verify ownership
    await verify_portfolio_ownership(portfolio_id, current_user.id, db)
    
    try:
        portfolio = await rollback_to_version(
            portfolio_id=portfolio_id,
            version_number=version_number,
            user_id=current_user.id,
            db=db
        )
        
        return PortfolioResponse.from_orm(portfolio)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
```

**Step 5: Create Version Schemas**

`backend/app/features/portfolios/schemas.py`:

```python
from pydantic import BaseModel, Field
from datetime import datetime

class VersionResponse(BaseModel):
    id: int
    version_number: int
    created_at: datetime
    created_by: int
    creator_name: str
    change_description: str | None
    
    class Config:
        from_attributes = True
    
    @classmethod
    def from_orm(cls, version: PortfolioVersion):
        return cls(
            id=version.id,
            version_number=version.version_number,
            created_at=version.created_at,
            created_by=version.created_by,
            creator_name=version.creator.name,
            change_description=version.change_description
        )


class PortfolioUpdateRequest(BaseModel):
    content: dict = Field(..., description="Updated portfolio content")
    change_description: str | None = Field(None, max_length=500)
```

**Step 6: Testing Checklist**
- [ ] Creating portfolio automatically creates version 1
- [ ] Updating portfolio creates new version
- [ ] Version limit enforced (keeps last 10)
- [ ] Version history retrieval works
- [ ] Rollback restores old content
- [ ] Rollback creates new version (not overwrite)
- [ ] Only portfolio owner can access versions
- [ ] Deleting portfolio cascades to versions

---

This is part 1 of the Sprint Implementation Guide. The document is too long to fit in one response. Shall I continue with:

**Part 2** - P2 Testing Tasks (Tasks 8-12)
**Part 3** - P3 Deployment & Infrastructure (Tasks 13-17)
**Part 4** - Implementation Patterns Library
**Part 5** - Team Coordination & Best Practices

Which part would you like me to continue with?
