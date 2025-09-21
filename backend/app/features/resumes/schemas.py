from pydantic import Field, PositiveInt
from app.shared.schemas import APIModel, IDModel, Timestamped
from app.shared.enums import ParseStatus, EmploymentType
from .jsonb_models import ResumeParsedJSON

class ResumeCreate(APIModel):
    source_file_id: int | None = Field(default=None, description="files.id")
    original_name: str | None = None
    is_primary: bool = False

class ResumeUpdate(APIModel):
    is_primary: bool | None = None
    parsed_json: ResumeParsedJSON | None = None
    parse_status: ParseStatus | None = None
    version: PositiveInt | None = None

class ResumeOut(IDModel, Timestamped):
    user_id: int
    source_file_id: int | None = None
    original_name: str | None = None
    parsed_json: ResumeParsedJSON | None = None
    parse_status: ParseStatus
    version: PositiveInt
    is_primary: bool
