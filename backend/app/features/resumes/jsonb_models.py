from typing import Annotated
from pydantic import BaseModel, ConfigDict, StrictStr, StringConstraints, EmailStr

NonEmptyShortStr = Annotated[str, StringConstraints(min_length=1, max_length=200, strip_whitespace=True)]

class EducationEntry(BaseModel):
    degree: StrictStr | None = None
    institution: StrictStr | None = None
    year: StrictStr | None = None  # "2019", "2019–2023" both allowed

class ExperienceEntry(BaseModel):
    role: StrictStr | None = None
    companies: list[NonEmptyShortStr] = []
    dates: StrictStr | None = None
    descriptions: list[NonEmptyShortStr] = []

class ResumeParsedJSON(BaseModel):
    """
    Canonical parsed resume schema (stable enough to store in JSONB).
    """
    name: StrictStr | None = None
    email: EmailStr | StrictStr | None = None
    phone: StrictStr | None = None
    about: StrictStr | None = None

    # Unstructured all-text capture for traceability
    full_text: StrictStr

    # Structured
    skills: list[NonEmptyShortStr] = []
    education: list[EducationEntry] = []
    experience: list[ExperienceEntry] = []

    model_config = ConfigDict(strict=True)
