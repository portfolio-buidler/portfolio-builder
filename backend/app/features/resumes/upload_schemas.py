from pydantic import BaseModel, ConfigDict
from typing import Any

class UploadData(BaseModel):
    fileId: str
    extractedData: Any | None = None  # מחזיק {"full_text": ..., "parsed": {...}}

class UploadResponse(BaseModel):
    success: bool
    message: str
    data: UploadData | None = None
    error: str | None = None
    model_config = ConfigDict(strict=True)
