from fastapi import APIRouter
from app.core.config import API_PREFIX
from .upload_schemas import UploadResponse
from .controller import upload_cv, upload_status

# Create a router for resume-related endpoints
router = APIRouter(prefix=API_PREFIX, tags=["resumes"])

router.add_api_route(
    "/upload", upload_cv,
    methods=["POST"],
    response_model=UploadResponse,
    status_code=201
)

router.add_api_route(
    "/upload/{file_id}/status",
    upload_status,
    methods=["GET"],
    response_model=UploadResponse
)
