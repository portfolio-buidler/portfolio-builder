from __future__ import annotations

from fastapi import UploadFile, File, HTTPException, status
from sqlalchemy import select
from app.core.db import AsyncSessionLocal
from app.db.models_resume import Resume
from app.shared.enums import ParseStatus
from .upload_schemas import UploadResponse, UploadData, SimpleParsedResponse
from .service import ResumeService
from .security import SUPPORTED_MIME
from .jsonb_models import ResumeParsed

async def upload_cv(file: UploadFile = File(...)) -> UploadResponse:
    # Quick content-type guard; we still validate magic bytes later.
    ct = (file.content_type or "")
    if ct not in SUPPORTED_MIME:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported content type: {ct or '(missing)'}"
        )

    svc = ResumeService()
    # Parse first. If it fails, DB stays clean.
    result = await svc.handle_upload(file)  # dict with keys: full_text, parsed, meta

    parsed_model = ResumeParsed(**result["parsed"])

    # Persist parsed JSON (JSONB) only on success
    async with AsyncSessionLocal() as session:
        resume = Resume(
            user_id=None,  # wire your auth later
            source_file_id=None,
            original_name=result["meta"]["source_file"],
            parse_status=ParseStatus.success,
            is_primary=False,
            parsed_json=parsed_model.model_dump(mode="json"),
        )
        session.add(resume)
        await session.flush()
        resume_id = resume.id
        await session.commit()

    extracted = {
        "full_text": result["full_text"],
        "parsed": parsed_model.model_dump(mode="json"),
        "file_info": {"filename": result["meta"]["source_file"], "content_type": result["meta"]["mime"]},
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
async def upload_cv_simple(file: UploadFile = File(...)) -> SimpleParsedResponse:
    svc = ResumeService()
    result = await svc.handle_upload(file)
    return SimpleParsedResponse(
        **result["parsed"],
        full_text=result["full_text"]
    )
