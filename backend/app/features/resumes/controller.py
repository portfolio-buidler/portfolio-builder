import secrets
from pathlib import Path
from fastapi import UploadFile, File, HTTPException, status
from app.core.config import MAX_UPLOAD_SIZE, ALLOWED_MIME, UPLOAD_DIR
from app.utils.sanitize import safe_filename
from backend.app.features.resumes.models import Resume
from .upload_schemas import UploadResponse, UploadData
from app.core.db import AsyncSessionLocal
from sqlalchemy.future import select

def _fake_parse_summary(path: Path) -> dict:
    return {"summary":"stub","skills":["Python","FastAPI"],"experiences":[],"education":[]}

async def _save_streamed(upload: UploadFile, dst: Path, limit: int) -> None:
    written = 0
    chunk = await upload.read(65536)
    with dst.open("wb") as f:
        while chunk:
            written += len(chunk)
            if written > limit:
                dst.unlink(missing_ok=True)
                raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File too large")
            f.write(chunk)
            chunk = await upload.read(65536)

async def upload_cv(file: UploadFile = File(...)) -> UploadResponse:
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=f"Unsupported {file.content_type}")
    safe_name = safe_filename(file.filename or "upload.bin")
    dst_name = f"{Path(safe_name).stem}_{secrets.token_hex(8)}{Path(safe_name).suffix.lower()}"
    dst = (UPLOAD_DIR / dst_name).absolute()
    await _save_streamed(file, dst, MAX_UPLOAD_SIZE)
    data = _fake_parse_summary(dst)
    
    async with AsyncSessionLocal() as session:
        resume = Resume(
            file_id=dst_name,
            original_name=file.filename or "upload.bin",
            mime_type=file.content_type,
            size_bytes=dst.stat().st_size,
            is_primary=False
        )
        session.add(resume)
        await session.commit()
    return UploadResponse(success=True, message="File uploaded successfully", data=UploadData(fileId=dst_name, extractedData=data))

async def upload_status(file_id: str) -> UploadResponse:
    path = UPLOAD_DIR / file_id
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return UploadResponse(success=True, message="Parsing completed", data=UploadData(fileId=file_id, extractedData={"parse_status":"parsed"}))