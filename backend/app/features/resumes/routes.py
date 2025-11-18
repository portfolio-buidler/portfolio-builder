from __future__ import annotations
from fastapi import APIRouter
from .upload_schemas import UploadResponse, SimpleParsedResponse
from .controller import upload_cv, upload_status, upload_cv_simple

router = APIRouter(prefix="/api/v1/resumes", tags=["resumes"])

router.add_api_route(
    "/upload",
    upload_cv,
    methods=["POST"],
    response_model=UploadResponse,
    status_code=201,
)
router.add_api_route(
    "/upload/simple",
    upload_cv_simple,
    methods=["POST"],
    response_model=SimpleParsedResponse,
    status_code=201,
)
router.add_api_route(
    "/upload/{file_id}/status",
    upload_status,
    methods=["GET"],
    response_model=UploadResponse,
)
