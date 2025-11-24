from __future__ import annotations

from fastapi import UploadFile, File, HTTPException, status, Depends
from sqlalchemy import select
from app.core.db import AsyncSessionLocal, get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models_resume import Resume
from app.shared.enums import ParseStatus
from .upload_schemas import UploadResponse, UploadData, SimpleParsedResponse, GuestUploadResponse
from .service import ResumeService
from .security import SUPPORTED_MIME
from .jsonb_models import ResumeParsed
import uuid
from datetime import datetime, timedelta
from app.core.security import get_current_user_optional, get_current_user
from app.db.models_user import User

# In-memory storage for guest uploads (temp_id -> parsed data)
# In production, use Redis with TTL
_guest_uploads: dict[str, dict] = {}

async def upload_cv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> UploadResponse:
    # Quick content-type guard; we still validate magic bytes later.
    ct = (file.content_type or "")
    if ct not in SUPPORTED_MIME:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported content type: {ct or '(missing)'}"
        )

    svc = ResumeService()
    # Parse first. If it fails, DB stays clean.
    result = await svc.handle_upload(file)  # UploadResult dataclass
    parsed_model = result.parsed_json
    # Persist parsed JSON (JSONB) only on success
    resume = Resume(
        user_id=current_user.id,  # Link to authenticated user
        source_file_id=None,
        original_name=result.original_name,
        parse_status=ParseStatus.success,
        is_primary=False,
        parsed_json=parsed_model.model_dump(mode="json"),
    )
    db.add(resume)
    await db.flush()
    resume_id = resume.id
    await db.commit()

    extracted = {
        "full_text": result.raw_text,
        "parsed": parsed_model.model_dump(mode="json"),
        "file_info": {"filename": result.original_name, "content_type": result.content_type},
    }
    return UploadResponse(
        success=True,
        message="File uploaded and parsed successfully",
        data=UploadData(fileId=str(resume_id), extractedData=extracted),
    )

async def upload_status(file_id: str) -> UploadResponse:
    async with AsyncSessionLocal() as session:
        stmt = select(Resume.id, Resume.parse_status, Resume.parsed_json).where(Resume.id == int(file_id))
        row = (await session.execute(stmt)).first()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

        extracted = {
            "parse_status": row.parse_status.value,
            "has_parsed_json": row.parsed_json is not None,
        }
        return UploadResponse(
            success=True,
            message="OK",
            data=UploadData(fileId=str(row.id), extractedData=extracted),
        )

# Optional simplified endpoint returning flattened parsed data only
async def upload_cv_simple(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> SimpleParsedResponse:
    svc = ResumeService()
    result = await svc.handle_upload(file)
    
    # Persist to database with user_id
    resume = Resume(
        user_id=current_user.id,  # Link to authenticated user
        source_file_id=None,
        original_name=result.original_name,
        parse_status=ParseStatus.success,
        is_primary=False,
        parsed_json=result.parsed_json.model_dump(mode="json"),
    )
    db.add(resume)
    await db.commit()
    
    return SimpleParsedResponse(
        **result.parsed_json.model_dump(mode="json"),
        full_text=result.raw_text
    )

async def upload_cv_guest(file: UploadFile = File(...)) -> GuestUploadResponse:
    """
    Upload CV as guest (unauthenticated user).
    Creates temporary storage with 2-minute TTL.
    User must authenticate and claim within 2 minutes.
    """
    # Quick content-type guard
    ct = (file.content_type or "")
    if ct not in SUPPORTED_MIME:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported content type: {ct or '(missing)'}"
        )

    svc = ResumeService()
    # Parse the file (validation happens here)
    result = await svc.handle_upload(file)
    parsed_model = result.parsed_json
    
    # Generate temporary ID
    temp_id = str(uuid.uuid4())
    expiry_seconds = 120  # 2 minutes
    expiry_time = datetime.utcnow() + timedelta(seconds=expiry_seconds)
    
    # Store temporarily in memory (use Redis in production)
    _guest_uploads[temp_id] = {
        "parsed_json": parsed_model.model_dump(mode="json"),
        "original_name": result.original_name,
        "content_type": result.content_type,
        "raw_text": result.raw_text,
        "expiry": expiry_time,
    }
    
    # Clean up expired uploads
    current_time = datetime.utcnow()
    expired_keys = [k for k, v in _guest_uploads.items() if v["expiry"] < current_time]
    for k in expired_keys:
        del _guest_uploads[k]
    
    extracted = {
        "full_text": result.raw_text,
        "parsed": parsed_model.model_dump(mode="json"),
        "file_info": {"filename": result.original_name, "content_type": result.content_type},
    }
    
    return GuestUploadResponse(
        success=True,
        message="File uploaded successfully. Please login within 2 minutes to save.",
        temp_id=temp_id,
        expiry_seconds=expiry_seconds,
        data=UploadData(fileId=temp_id, extractedData=extracted),
    )

async def claim_guest_upload(
    temp_id: str,
    current_user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
) -> UploadResponse:
    """
    Claim a guest upload after authentication.
    Converts temporary upload to permanent resume linked to user.
    """
    # Require authentication
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to claim upload"
        )
    
    # Check if temp upload exists
    if temp_id not in _guest_uploads:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found or expired. Please upload again."
        )
    
    upload_data = _guest_uploads[temp_id]
    
    # Check expiry
    if upload_data["expiry"] < datetime.utcnow():
        del _guest_uploads[temp_id]
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Upload expired. Please upload again."
        )
    
    # Create permanent resume
    resume = Resume(
        user_id=current_user.id,
        source_file_id=None,
        original_name=upload_data["original_name"],
        parse_status=ParseStatus.success,
        is_primary=False,
        parsed_json=upload_data["parsed_json"],
    )
    db.add(resume)
    await db.flush()
    resume_id = resume.id
    await db.commit()
    
    # Clean up temp storage
    del _guest_uploads[temp_id]
    
    extracted = {
        "full_text": upload_data["raw_text"],
        "parsed": upload_data["parsed_json"],
        "file_info": {
            "filename": upload_data["original_name"],
            "content_type": upload_data["content_type"]
        },
    }
    
    return UploadResponse(
        success=True,
        message="Upload claimed successfully",
        data=UploadData(fileId=str(resume_id), extractedData=extracted),
    )
