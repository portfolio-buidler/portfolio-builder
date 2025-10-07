from typing import Annotated
from datetime import datetime
from pydantic import Field, StrictStr, StrictInt, constr, field_validator, StringConstraints
from app.shared.schemas import APIModel, IDModel, Timestamped
from app.shared.enums import FileKind
import re

# defined allowed mime types for file uploads
ALLOWED_MIME = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
}

# Validation restrictions, Regex patterns for validating file names and tags and paths
SafePath = Annotated[str, StringConstraints( pattern=r"^file://[^\s]{3,}$", strip_whitespace=True)]
Sha256Hex = Annotated[str, StringConstraints(pattern=r"^[a-f0-9]{64}$")]
SafeTag = Annotated[str, StringConstraints(pattern=r"^[A-Za-z0-9_.+\-#]{1,32}$", strip_whitespace=True)]

# Register an uploaded file in the system
class FileCreate(APIModel):
    kind: FileKind
    storage_path: SafePath
    mime_type: StrictStr = Field(..., description="validated again by magic-bytes server-side")
    size_bytes: StrictInt = Field(..., ge=1, le=5 * 1024 * 1024)
    checksum: Sha256Hex
    

    @field_validator("mime_type")
    @classmethod
    def allowlisted_mime(cls, v: str) -> str:
        if v not in ALLOWED_MIME:
            raise ValueError("unsupported mime_type")
        return v
    
# File metadata returned from the API to clients
class FileOut(IDModel, Timestamped):
    kind: FileKind
    storage_path: SafePath
    mime_type: StrictStr
    size_bytes: StrictInt
    checksum: Sha256Hex
    tags: list[SafeTag] = []
    uploaded_at: datetime