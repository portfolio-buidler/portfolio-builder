from __future__ import annotations

import secrets
from dataclasses import dataclass
from pathlib import Path

from fastapi import UploadFile, HTTPException, status
from app.core.config import MAX_UPLOAD_SIZE, UPLOAD_DIR
from app.utils.sanitize import safe_filename

# New adapters (text only, no side-effects)
from app.features.adapters.pdf.reader import pdf_to_text as read_pdf_text
from app.features.adapters.docx.reader import docx_to_text as read_docx_text

# New parsing core (handles Projects-as-Experience and header synonyms)
from app.features.parsing.parser_core import parse_all_from_text

from .jsonb_models import ResumeParsedJSON
from .security import verify_magic_bytes, SUPPORTED_MIME, verify_extension

@dataclass
class UploadResult:
    original_name: str
    content_type: str
    raw_text: str
    parsed_json: ResumeParsedJSON

class ResumeService:
    async def handle_upload(self, file: UploadFile) -> UploadResult:
        verify_extension(file.filename or "")

        ct = (file.content_type or "")
        if ct not in SUPPORTED_MIME:
            raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                                detail=f"Unsupported content type: {ct or '(missing)'}")

        safe_name = safe_filename(file.filename or "upload.bin")
        dst_name = f"{Path(safe_name).stem}_{secrets.token_hex(8)}{Path(safe_name).suffix.lower()}"
        dst = (UPLOAD_DIR / dst_name).absolute()

        header = await self._save_streamed(file, dst, MAX_UPLOAD_SIZE)
        verify_magic_bytes(header, ct)

        try:
            raw_text = self._extract_text(dst, ct)
            if not raw_text.strip():
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                                    detail="Empty or unreadable document")

            parsed_dict = parse_all_from_text(raw_text)
            parsed = ResumeParsedJSON(**parsed_dict)
            return UploadResult(
                original_name=file.filename or "upload.bin",
                content_type=ct,
                raw_text=raw_text,
                parsed_json=parsed,
            )
        finally:
            try:
                dst.unlink(missing_ok=True)
            except Exception:
                pass

    async def _save_streamed(self, upload: UploadFile, dst: Path, limit: int) -> bytes:
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
            return read_pdf_text(str(path))
        return read_docx_text(str(path))
