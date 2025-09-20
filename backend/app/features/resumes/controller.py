from fastapi import UploadFile, File
from .upload_schemas import UploadResponse, UploadData
from .service import ResumeService
import json


async def upload_cv(file: UploadFile = File(...)) -> UploadResponse:
    svc = ResumeService()
    result = await svc.handle_upload(file)
    
    # Print the extracted data to console for debugging
    print("\n" + "="*50)
    print("CV UPLOAD SUCCESSFUL - EXTRACTED DATA:")
    print("="*50)
    print(json.dumps(result.extracted_data, indent=2, default=str))
    print("="*50 + "\n")
    
    return UploadResponse(
        success=True,
        message="File uploaded and parsed successfully",
        data=UploadData(fileId=result.file_id, extractedData=result.extracted_data)
    )

async def upload_status(file_id: str) -> UploadResponse:
    return UploadResponse(
        success=True,
        message="Parsing completed",
        data=UploadData(fileId=file_id, extractedData={"parse_status": "parsed"})
    )


async def get_parsed_json(file_id: str) -> dict:
    """
    Debug endpoint to return just the parsed JSON data.
    In a real implementation, you'd retrieve this from storage.
    """
    return {
        "file_id": file_id,
        "message": "This would return the parsed JSON data for the specified file_id",
        "note": "In the current implementation, data is only available during upload"
    }
