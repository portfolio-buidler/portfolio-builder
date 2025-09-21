from typing import Annotated
from datetime import date
from pydantic import BaseModel, ConfigDict, StrictStr, StringConstraints

NonEmptyStr = Annotated[str, StringConstraints(min_length=1, max_length=200, strip_whitespace=True)]

class ResumeExpJSON(BaseModel):
    company: NonEmptyStr
    title: NonEmptyStr
    location: StrictStr | None = None
    start_date: date | None = None
    end_date: date | None = None
    bullets: list[StrictStr] | None = None
    technologies: list[StrictStr] | None = None
    model_config = ConfigDict(strict=True)

class EducationJSON(BaseModel):
    school: NonEmptyStr
    degree: NonEmptyStr | None = None
    field_of_study: StrictStr | None = None
    start_date: date | None = None
    end_date: date | None = None
    grade: StrictStr | None = None
    activities: list[StrictStr] | None = None
    model_config = ConfigDict(strict=True)

class ResumeParsedJSON(BaseModel):
    summary: StrictStr | None = None
    skills: list[StrictStr] | None = None
    experiences: list[ResumeExpJSON] | None = None
    education: list[EducationJSON] | None = None  
    model_config = ConfigDict(strict=True)
