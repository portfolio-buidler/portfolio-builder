from __future__ import annotations
from fastapi import UploadFile, File, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.exc import NoResultFound
from app.core.db import AsyncSessionLocal
from app.db.models_resume import Resume
from app.shared.enums import ParseStatus
from .upload_schemas import UploadResponse, UploadData
from .service import ResumeService
from .security import SUPPORTED_MIME

async def upload_cv(file: UploadFile = File(...)) -> UploadResponse:
    svc = ResumeService()

    # Fast-fail unsupported MIME before touching the database (improves perf & testability)
    ct = file.content_type or ""
    if ct not in SUPPORTED_MIME:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported content type: {ct}"
        )

    # Parse first; if this fails we don't touch the DB
    result = await svc.handle_upload(file)

    # Create DB row only on success
    async with AsyncSessionLocal() as session:
        resume = Resume(
            user_id=None,
            source_file_id=None,
            original_name=file.filename or "upload.bin",
            parse_status=ParseStatus.success,
            is_primary=False,
            parsed_json=result.parsed_json.model_dump(mode="json"),
        )
        session.add(resume)
        await session.flush()
        resume_id = resume.id
        await session.commit()

    # Response includes both full_text and parsed JSON
    extracted = {
        "full_text": result.raw_text,
        "parsed": result.parsed_json.model_dump(mode="json"),
        "file_info": {"filename": result.original_name, "content_type": result.content_type},
    }
    return UploadResponse(
        success=True,
        message="File uploaded and parsed successfully",
        data=UploadData(fileId=str(resume_id), extractedData=extracted),
    )

async def upload_status(file_id: str) -> UploadResponse:
    # reads status from DB (not the filesystem)
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
