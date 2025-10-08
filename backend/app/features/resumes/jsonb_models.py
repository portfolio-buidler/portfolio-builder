from __future__ import annotations
from typing import Annotated, Optional, List
from pydantic import BaseModel, ConfigDict, StrictStr, StringConstraints, EmailStr

# centralize limits so we don't bikeshed later
MAX_NAME_LEN = 200
MAX_SKILL_LEN = 64
MAX_EDU_FIELD_LEN = 200
MAX_DESC_LEN = 300  # bullets can be long; JSONB can take it

NonEmptyShortStr = Annotated[str, StringConstraints(min_length=1, max_length=MAX_NAME_LEN, strip_whitespace=True)]
SkillStr = Annotated[str, StringConstraints(min_length=1, max_length=MAX_SKILL_LEN, strip_whitespace=True)]
EduStr = Annotated[str, StringConstraints(min_length=1, max_length=MAX_EDU_FIELD_LEN, strip_whitespace=True)]
DescStr = Annotated[str, StringConstraints(min_length=1, max_length=MAX_DESC_LEN, strip_whitespace=True)]

class EducationEntry(BaseModel):
    degree: Optional[EduStr] = None
    institution: Optional[EduStr] = None
    years: Optional[StrictStr] = None      # e.g. "2021–2025" or "Expected 2025"

class ExperienceEntry(BaseModel):
    role: Optional[NonEmptyShortStr] = None
    company: Optional[NonEmptyShortStr] = None
    dates: Optional[StrictStr] = None      # keep human-readable for MVP
    description: Optional[DescStr] = None

class ProjectEntry(BaseModel):
    project_name: Optional[NonEmptyShortStr] = None
    description: Optional[DescStr] = None

class ResumeParsed(BaseModel):
    # Contact
    name: Optional[NonEmptyShortStr] = None
    email: EmailStr | StrictStr | None = None
    phone: Optional[StrictStr] = None
    linkedin: Optional[StrictStr] = None
    github: Optional[StrictStr] = None

    # Summary
    about: Optional[StrictStr] = None

    # Structured
    skills: List[SkillStr] = []
    education: List[EducationEntry] = []
    experience: List[ExperienceEntry] = []
    projects: List[ProjectEntry] = []

    # Locale-specific
    military_service: Optional[StrictStr] = None

    model_config = ConfigDict(strict=True)
