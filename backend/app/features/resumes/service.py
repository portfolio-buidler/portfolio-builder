from __future__ import annotations
import secrets
from dataclasses import dataclass
from pathlib import Path

from fastapi import UploadFile, HTTPException, status
from app.core.config import MAX_UPLOAD_SIZE, UPLOAD_DIR
from app.utils.sanitize import safe_filename
from .text_extractors import extract_text_from_pdf, extract_text_from_docx
from .cv_parser import CVParser
from .jsonb_models import ResumeParsedJSON
from .security import verify_magic_bytes, SUPPORTED_MIME

@dataclass
class UploadResult:
    original_name: str
    content_type: str
    raw_text: str
    parsed_json: ResumeParsedJSON

class ResumeService:
    def __init__(self) -> None:
        self.parser = CVParser()

    async def handle_upload(self, file: UploadFile) -> UploadResult:
        if (ct := (file.content_type or "")) not in SUPPORTED_MIME:
            raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                                detail=f"Unsupported content type: {file.content_type}")

        safe_name = safe_filename(file.filename or "upload.bin")
        dst_name = f"{Path(safe_name).stem}_{secrets.token_hex(8)}{Path(safe_name).suffix.lower()}"
        dst = (UPLOAD_DIR / dst_name).absolute()

        header = await self._save_streamed(file, dst, MAX_UPLOAD_SIZE)

        # Security: validate magic bytes before parsing
        verify_magic_bytes(header, ct)

        try:
            raw_text = self._extract_text(dst, ct)
            if not raw_text.strip():
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                                    detail="Empty or unreadable document")

            parsed = self.parser.parse(raw_text)  # -> ResumeParsedJSON
            return UploadResult(
                original_name=file.filename or "upload.bin",
                content_type=ct,
                raw_text=raw_text,
                parsed_json=parsed,
            )
        finally:
            # We don't need the temp file after extraction
            try:
                dst.unlink(missing_ok=True)
            except Exception:
                pass

    async def _save_streamed(self, upload: UploadFile, dst: Path, limit: int) -> bytes:
        """
        Stream-save to disk with size enforcement. Returns the first bytes
        to be used for signature validation.
        """
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
                    raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                                        detail="File too large")
                f.write(chunk)
                chunk = await upload.read(8192)
        return header

    def _extract_text(self, path: Path, content_type: str) -> str:
        if content_type == "application/pdf":
            return extract_text_from_pdf(path)
        # else DOCX
        return extract_text_from_docx(path)
