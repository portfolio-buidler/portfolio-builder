from __future__ import annotations

from pathlib import Path
from fastapi import HTTPException, status
from typing import Final

# Signatures
PDF_MAGIC: Final[bytes] = b"%PDF"
DOCX_MAGIC_ZIP: Final[bytes] = b"PK\x03\x04"  # DOCX is a ZIP

SUPPORTED_MIME: Final[set[str]] = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
ALLOWED_EXTENSIONS: Final[set[str]] = {".pdf", ".docx"}

def verify_extension(filename: str) -> None:
    suffix = Path(filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file extension: {suffix or '(none)'}",
        )

def verify_magic_bytes(header: bytes, content_type: str) -> None:
    if content_type not in SUPPORTED_MIME:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                            detail=f"Unsupported {content_type or '(missing)'}")
    if content_type == "application/pdf":
        if not header.startswith(PDF_MAGIC):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                                detail="Invalid PDF signature")
    else:
        if not header.startswith(DOCX_MAGIC_ZIP):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                                detail="Invalid DOCX signature")
