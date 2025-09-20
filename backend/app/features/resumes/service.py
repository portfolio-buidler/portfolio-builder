import secrets
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from fastapi import UploadFile, HTTPException, status
from app.core.config import MAX_UPLOAD_SIZE, UPLOAD_DIR  
from app.utils.sanitize import safe_filename
from .text_extractors import extract_text_from_pdf, extract_text_from_docx
from .cv_parser import CVParser

@dataclass
class UploadResult:
    file_id: str
    extracted_data: dict[str, Any]

ONLY_MIME = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

class ResumeService:
    def __init__(self):
        self.cv_parser = CVParser()
    
    async def handle_upload(self, file: UploadFile) -> UploadResult:
        content_type = file.content_type or ""
        if content_type not in ONLY_MIME:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported content type: {content_type}"
            )

        safe_name = safe_filename(file.filename or "upload.bin")
        dst_name = f"{Path(safe_name).stem}_{secrets.token_hex(8)}{Path(safe_name).suffix.lower()}"
        dst = (UPLOAD_DIR / dst_name).absolute()
        await self._save_streamed(file, dst, MAX_UPLOAD_SIZE)

        try:
            full_text = self._extract_text(dst, content_type)
            
            # Parse the CV and extract structured data
            parsed_data = self.cv_parser.parse_cv_text(full_text)
            
            extracted = {
                "full_text": full_text,
                "parsed_data": parsed_data,
                "file_info": {
                    "filename": file.filename,
                    "content_type": content_type,
                    "size": file.size if hasattr(file, 'size') else None
                }
            }
            return UploadResult(file_id=dst_name, extracted_data=extracted)
        finally:
            try:
                dst.unlink(missing_ok=True) # Clean up the uploaded file
            except Exception:
                pass

    async def _save_streamed(self, upload: UploadFile, dst: Path, limit: int) -> None:
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

    def _extract_text(self, path: Path, mime: str) -> str:
        suffix = path.suffix.lower()
        if mime == "application/pdf" or suffix == ".pdf":
            return extract_text_from_pdf(path)
        if mime == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" or suffix == ".docx":
            return extract_text_from_docx(path)
        return ""
