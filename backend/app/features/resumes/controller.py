import hashlib,os,time
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status, Request
from pydantic import StrictStr, StrictInt, StringConstraints, field_validator, BaseModel, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.schemas import APIModel, Timestamped

router = APIRouter(prefix="/resumes", tags=["resumes"])

# Allowed MIME types for resume uploads (PDF and Word documents) 
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

# Maximum file size for uploads (5 MB)
MAX_FILE_SIZE = 5 * 1024 * 1024  

# Check real MIME type from file header
def magic_check(header: bytes) -> str | None:
    if header.startswith(b"%PDF"): return "application/pdf"
    if header.startswith(b"PK\x03\x04"): return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    return None

# Acknowledge that the server received the file with metadata
class UploadedResumeOut(Timestamped):
    id: int | None = None
    file_name: StrictStr
    mime_type: StrictStr
    size_bytes: StrictInt
    checksum: StrictStr
    message: StrictStr = "File Received Successfully"

@router.post("/upload", response_model=UploadedResumeOut, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    request: Request, file: UploadFile = File(...)) -> UploadedResumeOut:
    content_length = request.headers.get('content-length')
    if content_length is None or int(content_length) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large")
    
    # storage path
    temp_dir_file_storage = Path("/temp/temp_uploads")
    temp_dir_file_storage.mkdir(parents=True, exist_ok=True)
    temp_file_path = temp_dir_file_storage / f"upload_{int(time.time()*1000)}_{file.filename}"
    
    # hashing and size tracking
    sha256 = hashlib.sha256()
    total = 0
    header = b""

    # stream read and write to temp file 1MB at a time
    with temp_file_path.open("wb") as out:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            total += len(chunk)
            if total > MAX_FILE_SIZE:
                out.close()
                temp_file_path.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail="file too large")
            if len(header) < 16:
                header += chunk[:16]
            sha256.update(chunk)
            out.write(chunk)
            
    # Validate MIME type
    mime_type = magic_check(header)
    if mime_type not in ALLOWED_MIME_TYPES:
        out.close()
        temp_file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=415, detail="Unsupported file type")

    # Finalize upload
    return UploadedResumeOut(
        id=None,
        file_name=file.filename,
        mime_type=mime_type,
        size_bytes=total,
        checksum=sha256.hexdigest(),
        created_at=datetime.now,
        updated_at=datetime.now,
        message="File uploaded successfully"
    )
