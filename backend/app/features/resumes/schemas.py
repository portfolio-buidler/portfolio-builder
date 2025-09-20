from datetime import date, datetime
from typing import Any
from pydantic import Field, PositiveInt
from app.shared.schemas import APIModel, IDModel, Timestamped
from app.shared.enums import ParseStatus, EmploymentType
from .jsonb_models import ResumeParsedJSON  # חדש

# Create a resume record
class ResumeCreate(APIModel):
    source_file_id: int | None = Field(default=None, description="files.id")
    original_name: str | None = None
    is_primary: bool = False

# Updates an existing resume record
class ResumeUpdate(APIModel):
    is_primary: bool | None = None
    # היה dict[str, str] | None
    parsed_json: ResumeParsedJSON | None = None  # או: dict[str, Any] | None
    parse_status: ParseStatus | None = None
    version: PositiveInt | None = None

# Resume output as it is returned for the user
class ResumeOut(IDModel, Timestamped):
    user_id: int
    source_file_id: int | None = None
    original_name: str | None = None
    # היה dict[str, str] | None
    parsed_json: ResumeParsedJSON | None = None  # או: dict[str, Any] | None
    parse_status: ParseStatus
    version: PositiveInt
    is_primary: bool

# Creating a new experience entry linked to a resume
class ExperienceCreate(APIModel):
    resume_id: int
    company: str
    title: str
    location: str | None = None
    employment: EmploymentType | None = None
    start_date: date | None = None
    end_date: date | None = None
    bullets: list[str] | None = None
    technologies: list[str] | None = None
    sort_order: int = 0

# Single experience entry
class ExperienceOut(IDModel, APIModel):
    resume_id: int
    company: str
    title: str
    location: str | None = None
    employment: EmploymentType | None = None
    start_date: date | None = None
    end_date: date | None = None
    bullets: list[str] | None = None
    technologies: list[str] | None = None
    sort_order: int

# Creating a new education entry linked to a resume
class EducationCreate(APIModel):
    resume_id: int
    school: str
    degree: str | None = None
    field: str | None = None
    start_year: int | None = None
    end_year: int | None = None
    sort_order: int = 0

# Returning a single education entry
class EducationOut(IDModel, APIModel):
    resume_id: int
    school: str
    degree: str | None = None
    field: str | None = None
    start_year: int | None = None
    end_year: int | None = None
    sort_order: int
