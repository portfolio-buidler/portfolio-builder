from fastapi import UploadFile, File
from .upload_schemas import UploadResponse, UploadData
from .service import ResumeService


async def upload_cv(file: UploadFile = File(...)) -> UploadResponse:
    svc = ResumeService()
    result = await svc.handle_upload(file)
    return UploadResponse(
        success=True,
        message="File uploaded successfully",
        data=UploadData(fileId=result.file_id, extractedData=result.extracted_data)
    )

async def upload_status(file_id: str) -> UploadResponse:
    return UploadResponse(
        success=True,
        message="Parsing completed",
        data=UploadData(fileId=file_id, extractedData={"parse_status": "parsed"})
    )
