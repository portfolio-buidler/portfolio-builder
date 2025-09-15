from typing import Any
from pydantic import BaseModel, ConfigDict

class UploadData(BaseModel):
    fileId: str
    extractedData: Any | None = None

class UploadResponse(BaseModel):
    success: bool
    message: str
    data: UploadData | None = None
    error: str | None = None
    model_config = ConfigDict(strict=True)
