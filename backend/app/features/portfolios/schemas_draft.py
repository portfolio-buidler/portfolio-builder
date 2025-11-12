# app/features/portfolio/schemas_draft.py
"""
Pydantic schemas for portfolio draft create/update/read.

Goals:
- Keep the wire format stable for the editor UI.
- Allow partial updates (PATCH) safely.
- Be explicit on section names to validate order/visibility.
"""

from typing import Any, Literal
from pydantic import Field, StrictBool, BaseModel
from app.shared.schemas import APIModel, IDModel, Timestamped

# --- Section names the editor knows about (kept simple & explicit) ---
# Using a Literal ensures only known section identifiers are accepted, improving validation
# and IDE autocompletion while preventing typos in API consumers.
SectionName = Literal[
    "summary", "projects", "skills", "experience", "education", "contact"
]


class AboutDTO(APIModel):
    """Represents the 'About/Summary' text block shown at the top of the portfolio."""
    text: str | None = Field(default=None, description="Short about/summary text")


class ContactDTO(APIModel):
    """
    Contact details displayed in the portfolio footer or dedicated contact section.

    Notes:
      - Keep fields optional to support partial updates and progressive profile completion.
      - URLs are simple strings here; URL validation (if needed) can be handled at the UI or service layer.
    """
    email: str | None = None
    phone: str | None = None
    linkedin: str | None = None
    github: str | None = None
    website: str | None = None


class SectionsVisibilityDTO(APIModel):
    """
    Controls toggling of each top-level section in the editor/renderer.

    Using StrictBool enforces actual booleans (no coercion from truthy/falsy values),
    which helps catch payload mistakes early at the schema boundary.
    """
    # Using loose dict[str,bool] would be OK too, but explicit helps validation at the edges.
    summary: StrictBool | None = True
    projects: StrictBool | None = True
    skills: StrictBool | None = True
    experience: StrictBool | None = True
    education: StrictBool | None = True
    contact: StrictBool | None = True


# --- The flexible content blob the editor works with ---
class DraftDataDTO(APIModel):
    """
    Flexible, UI-owned content payload.

    The server deliberately keeps this structure permissive to allow UI evolution without
    frequent backend schema changes. Each key corresponds to a section and can hold
    arbitrary shapes (dicts/lists) that the front-end understands.
    """
    # Keep keys generic; UI owns exact shapes inside each bucket.
    summary: dict[str, Any] | None = None
    projects: list[dict[str, Any]] | None = None
    skills: dict[str, Any] | None = None
    experience: list[dict[str, Any]] | None = None
    education: list[dict[str, Any]] | None = None
    recommendations: list[dict[str, Any]] | None = None
    awards: list[dict[str, Any]] | None = None
    languages: list[str] | None = None


# --- Incoming payloads ---
class PortfolioDraftCreate(APIModel):
    """
    Payload for creating a new portfolio draft.

    Fields are optional to support:
      - Seeding from a resume (via `resume_source_id`).
      - Starting with a minimal draft and progressively enriching it.
    """
    # Optional seed from parser / resume mapper
    resume_source_id: int | None = None

    about: AboutDTO | None = None
    contact: ContactDTO | None = None
    sections_order: list[SectionName] | None = None
    sections_visibility: SectionsVisibilityDTO | None = None
    data: DraftDataDTO | None = None


class PortfolioDraftUpdate(BaseModel):
    """
    Payload for partial updates (PATCH) of an existing draft.

    Design choices:
      - Use raw dicts for sub-objects to allow partial field updates without full object replacement.
      - Keep all fields optional so clients can send only what changed.
      - Extra fields are ignored to make the API forgiving during iterative UI development.
    """
    about: dict[str, Any] | None = Field(default=None)
    contact: dict[str, Any] | None = Field(default=None)
    sections_order: list[str] | None = Field(default=None)
    sections_visibility: dict[str, bool] | None = Field(default=None)
    data: dict[str, Any] | None = Field(default=None)

    class Config:
        # Rejects unknown fields at model root, preventing accidental payload noise from being persisted.
        # (Unknown fields within nested dicts are intentionally allowed for flexibility.)
        extra = "ignore"  # דוחה שדות לא מוכרים


# --- Outgoing shape ---
class PortfolioDraftOut(IDModel, Timestamped):
    """
    Response model returned to clients when reading a portfolio draft.

    Inherits:
      - IDModel: provides the primary identifier.
      - Timestamped: provides created/updated timestamps for optimistic UI and auditability.
    """
    user_id: int
    resume_source_id: int | None = None

    about: AboutDTO | None = None
    contact: ContactDTO | None = None
    sections_order: list[SectionName] | None = None
    sections_visibility: SectionsVisibilityDTO | None = None
    data: DraftDataDTO | None = None

    # Versioning enables optimistic concurrency and client-side cache invalidation.
    version: int
    is_active: bool
