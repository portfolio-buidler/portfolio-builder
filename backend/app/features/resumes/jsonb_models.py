from typing import Annotated
from datetime import date
from pydantic import BaseModel, ConfigDict, StrictStr, StrictInt, StringConstraints

NonEmptyStr = Annotated[str, StringConstraints(min_length=1, max_length=50, strip_whitespace=True)]

# Single experience entry in parsed resume JSON
class ResumeExpJSON(BaseModel):
    company: NonEmptyStr
    title: NonEmptyStr
    location: StrictStr | None = None
    start_date: date | None = None
    end_date: date | None = None
    bullets: list[StrictStr] | None = None
    technologies: list[StrictStr] | None = None
    model_config = ConfigDict(strict=True)

# Single education entry in parsed resume JSON
class EducationJSON(BaseModel):
    school: NonEmptyStr
    degree: NonEmptyStr
    field_of_study: StrictStr | None = None
    start_date: date | None = None
    end_date: date | None = None
    grade: StrictStr | None = None
    activities: list[StrictStr] | None = None
    model_config = ConfigDict(strict=True)

# Overall parsed resume JSON structure
class ResumeParsedJSON(BaseModel):
    summary: StrictStr | None = None
    skills: list[StrictStr] | None = None
    experiences: list[ResumeExpJSON] | None = None
    education: list[dict] | None = None  
    model_config = ConfigDict(strict=True)