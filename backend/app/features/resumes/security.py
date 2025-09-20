from __future__ import annotations
from pathlib import Path
from fastapi import HTTPException, status

PDF_MAGIC = b"%PDF-"
ZIP_MAGIC = b"PK\x03\x04"  # docx is a ZIP container

def verify_magic_bytes(path: Path, mime: str) -> None:
    try:
        with path.open("rb") as f:
            head = f.read(8)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot read uploaded file")

    if mime == "application/pdf":
        if not head.startswith(PDF_MAGIC):
            raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Invalid PDF signature")
    elif mime == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        if not head.startswith(ZIP_MAGIC):
            raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Invalid DOCX signature")
    else:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=f"Unsupported {mime}")
