import secrets
from pathlib import Path
from fastapi import UploadFile, File, HTTPException, status
from app.core.config import MAX_UPLOAD_SIZE, ALLOWED_MIME, UPLOAD_DIR
from app.utils.sanitize import safe_filename
from .upload_schemas import UploadResponse, UploadData
from .extract import parse_resume_file

async def _save_streamed(upload: UploadFile, dst: Path, limit: int) -> None:
    written = 0
    chunk = await upload.read(65536)
    with dst.open("wb") as f:
        while chunk:
            written += len(chunk)
            if written > limit:
                dst.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="File too large"
                )
            f.write(chunk)
            chunk = await upload.read(65536)

async def upload_cv(file: UploadFile = File(...)) -> UploadResponse:
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported {file.content_type}"
        )

    # Create a safe, unique filename
    safe_name = safe_filename(file.filename or "upload.bin")
    dst_name = f"{Path(safe_name).stem}_{secrets.token_hex(8)}{Path(safe_name).suffix.lower()}"
    dst = (UPLOAD_DIR / dst_name).absolute()

    # Save the uploaded file
    await _save_streamed(file, dst, MAX_UPLOAD_SIZE)

    # Parse the PDF using the real parser
    try:
        extracted_data = parse_resume_file(dst)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse resume: {str(e)}"
        )

    # Return the extracted data as JSON
    return UploadResponse(
        success=True,
        message="File uploaded and parsed successfully",
        data=UploadData(
            fileId=dst_name,
            extractedData=extracted_data
        )
    )
async def upload_status(file_id: str) -> UploadResponse:
    path = UPLOAD_DIR / file_id
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return UploadResponse(success=True, message="Parsing completed", data=UploadData(fileId=file_id, extractedData={"parse_status":"parsed"}))