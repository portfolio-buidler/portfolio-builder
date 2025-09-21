from __future__ import annotations
from fastapi import HTTPException, status
from typing import Final

# Supported signatures
PDF_MAGIC: Final[bytes] = b"%PDF"
DOCX_MAGIC_ZIP: Final[bytes] = b"PK\x03\x04"  # DOCX is a ZIP container

SUPPORTED_MIME: Final[set[str]] = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

def verify_magic_bytes(header: bytes, content_type: str) -> None:
    """
    Basic signature validation for PDF/DOCX.
    Not a substitute for AV, but blocks obviously invalid uploads early.
    """
    if content_type not in SUPPORTED_MIME:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                            detail=f"Unsupported {content_type}")

    if content_type == "application/pdf":
        if not header.startswith(PDF_MAGIC):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                                detail="Invalid PDF signature")
    else:  # DOCX
        if not header.startswith(DOCX_MAGIC_ZIP):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                                detail="Invalid DOCX signature")
