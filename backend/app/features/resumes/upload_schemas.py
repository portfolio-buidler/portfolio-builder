from __future__ import annotations
from pydantic import BaseModel, ConfigDict
from typing import Any

class UploadData(BaseModel):
    fileId: str
    extractedData: Any | None = None  # {"full_text": ..., "parsed": {...}, "file_info": {...}}

class UploadResponse(BaseModel):
    success: bool
    message: str
    data: UploadData | None = None
    error: str | None = None
    model_config = ConfigDict(strict=True)

class GuestUploadResponse(BaseModel):
    """Response for guest (unauthenticated) upload with temporary storage"""
    success: bool
    message: str
    temp_id: str  # Temporary upload identifier
    expiry_seconds: int  # TTL in seconds (typically 120 = 2 minutes)
    data: UploadData | None = None  # Preview data for immediate display
    model_config = ConfigDict(strict=True)

class SimpleParsedResponse(BaseModel):
    # Flattened response shape expected by frontend preview
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    linkedin: str | None = None
    github: str | None = None
    about: str | None = None
    skills: list[str] = []
    education: list[dict] = []
    experience: list[dict] = []
    projects: list[dict] = []
    military_service: str | None = None
    full_text: str | None = None
