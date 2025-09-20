from fastapi import HTTPException, status
from typing import Final

# החתימות שאנחנו תומכים בהן כרגע
PDF_MAGIC: Final[bytes] = b"%PDF"
DOCX_MAGIC_ZIP: Final[bytes] = b"PK\x03\x04"  # docx הוא zip

def verify_magic_bytes(head: bytes, content_type: str) -> None:
    """
    בדיקת magic bytes בסיסית לקבצים נתמכים (PDF/DOCX).
    לא מהווה AV אך מסנן קבצים פגומים/מוטים בשלב מוקדם.
    """
    if content_type == "application/pdf":
        if not head.startswith(PDF_MAGIC):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid PDF signature")
    elif content_type in {"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        "application/msword"}:
        if not head.startswith(DOCX_MAGIC_ZIP):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid DOCX signature")
    else:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=f"Unsupported {content_type}")
