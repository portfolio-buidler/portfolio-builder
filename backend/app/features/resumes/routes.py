from fastapi import APIRouter
from .upload_schemas import UploadResponse
from .controller import upload_cv, upload_status, get_parsed_json

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
router.add_api_route(
    "/parsed/{file_id}", get_parsed_json, methods=["GET"], response_model=dict
)
