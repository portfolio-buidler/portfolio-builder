from fastapi import UploadFile, File
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import AsyncSessionLocal
from app.db.models_resume import Resume
from app.shared.enums import ParseStatus
from .upload_schemas import UploadResponse, UploadData
from .service import ResumeService

async def upload_cv(file: UploadFile = File(...)) -> UploadResponse:
    svc = ResumeService()
    result = await svc.handle_upload(file)

    async with AsyncSessionLocal() as session:  # type: AsyncSession
        # צור רשומה חדשה במצב "parsing"
        resume = Resume(
            user_id=None,
            source_file_id=None,
            original_name=result.original_name,
            parse_status=ParseStatus.parsing,
            is_primary=False,
            parsed_json=None
        )
        session.add(resume)
        await session.flush()  # מקבל id
        resume_id = resume.id

        # עדכן parsed_json והסטטוס
        await session.execute(
            update(Resume)
            .where(Resume.id == resume_id)
            .values(parsed_json=result.parsed_json.model_dump(mode="json"),
                    parse_status=ParseStatus.success)
        )
        await session.commit()

    # מחזירים גם full_text וגם parsed במבנה אחד
    extracted = {
        "full_text": result.raw_text,
        "parsed": result.parsed_json.model_dump(mode="json"),
    }
    return UploadResponse(
        success=True,
        message="File uploaded and parsed successfully",
        data=UploadData(fileId=str(resume_id), extractedData=extracted)
    )

async def upload_status(file_id: str) -> UploadResponse:
    async with AsyncSessionLocal() as session:
        stmt = select(Resume.id, Resume.parse_status, Resume.parsed_json).where(Resume.id == int(file_id))
        row = (await session.execute(stmt)).first()
        if not row:
            return UploadResponse(success=False, message="Not found", error="resume_not_found")
        extracted = {"parse_status": row.parse_status.value}
        return UploadResponse(success=True, message="OK", data=UploadData(fileId=str(row.id), extractedData=extracted))

async def get_parsed_json(file_id: str) -> dict:
    async with AsyncSessionLocal() as session:
        stmt = select(Resume.id, Resume.parsed_json).where(Resume.id == int(file_id))
        row = (await session.execute(stmt)).first()
        if not row:
            return {"error": "resume_not_found"}
        return {"file_id": str(row.id), "parsed_json": row.parsed_json}
