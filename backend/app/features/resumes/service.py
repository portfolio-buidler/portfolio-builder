import secrets
from dataclasses import dataclass
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from app.core.config import MAX_UPLOAD_SIZE, UPLOAD_DIR
from app.utils.sanitize import safe_filename
from .text_extractors import extract_text_from_pdf, extract_text_from_docx
from .cv_parser import CVParser
from .jsonb_models import ResumeParsedJSON
from .security import verify_magic_bytes

SUPPORTED_MIME = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
}

@dataclass
class UploadResult:
    tmp_path: Path
    original_name: str
    content_type: str
    raw_text: str
    parsed_json: ResumeParsedJSON

class ResumeService:
    def __init__(self) -> None:
        self.parser = CVParser()

    async def _save_streamed(self, upload: UploadFile, dst: Path, limit: int) -> bytes:
        """שומר לקובץ ומחזיר את ה-header bytes לבדיקה."""
        header = b""
        written = 0
        chunk = await upload.read(8192)
        with dst.open("wb") as f:
            while chunk:
                if not header:
                    header = chunk[:8]
                written += len(chunk)
                if written > limit:
                    dst.unlink(missing_ok=True)
                    raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File too large")
                f.write(chunk)
                chunk = await upload.read(8192)
        return header

    async def handle_upload(self, file: UploadFile) -> UploadResult:
        if file.content_type not in SUPPORTED_MIME:
            raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=f"Unsupported {file.content_type}")

        safe_name = safe_filename(file.filename or "upload.bin")
        dst_name = f"{Path(safe_name).stem}_{secrets.token_hex(8)}{Path(safe_name).suffix.lower()}"
        dst = (UPLOAD_DIR / dst_name).absolute()
        header = await self._save_streamed(file, dst, MAX_UPLOAD_SIZE)

        # בדיקת חתימה
        verify_magic_bytes(header, file.content_type)

        # חילוץ טקסט
        if file.content_type == "application/pdf":
            raw_text = extract_text_from_pdf(dst)
        else:
            raw_text = extract_text_from_docx(dst)

        if not raw_text.strip():
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Empty or unreadable document")

        parsed = self.parser.parse(raw_text)

        return UploadResult(
            tmp_path=dst,
            original_name=file.filename or "upload.bin",
            content_type=file.content_type,
            raw_text=raw_text,
            parsed_json=parsed,
        )
