from __future__ import annotations
from fastapi import APIRouter
from .upload_schemas import UploadResponse
from .controller import upload_cv, upload_status

router = APIRouter(prefix="/resumes", tags=["resumes"])

router.add_api_route(
    "/upload",
    upload_cv,
    methods=["POST"],
    response_model=UploadResponse,
    status_code=201,
)
router.add_api_route(
    "/upload/{file_id}/status",
    upload_status,
    methods=["GET"],
    response_model=UploadResponse,
)
