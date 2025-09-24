from typing import Annotated
from pydantic import BaseModel, ConfigDict, StrictStr, StringConstraints

NonEmptyShortStr = Annotated[str, StringConstraints(min_length=1, max_length=200, strip_whitespace=True)]


class ResumeParsedJSON(BaseModel):
    """Simplified parsed resume schema.

    - name: Full name 
    - email: First-matched email address
    - phone: First-matched phone number
    - about: Summary/About text block
    - experience: Free-text block aggregated under Experience/Projects sections
    - education: Free-text block aggregated under Education section
    - skills: List of skills if a Skills section or inline list is detected
    """

    name: StrictStr | None = None
    email: StrictStr | None = None
    phone: StrictStr | None = None
    about: StrictStr | None = None
    experience: StrictStr | None = None
    education: StrictStr | None = None
    skills: list[NonEmptyShortStr] | None = None
    model_config = ConfigDict(strict=True)
