from datetime import datetime
from typing import Annotated
from pydantic import EmailStr, Field, StrictStr, StringConstraints, constr
from app.shared.schemas import APIModel, IDModel, Timestamped
from app.shared.enums import PortfolioStatus
from typing import Annotated, Literal, Optional, List, Dict


slug_regex = r"^[a-z]+\.{1}[a-z]+$"
Slug = Annotated[str, StringConstraints(pattern=slug_regex)]
Phone = Annotated[str, StringConstraints(pattern=r"^(?:\+972|0)(5[0-9])[-]?\d{7}$")]

# Search engine optimization config for portfolio site
class SEOConfig(APIModel):
    title: str | None = None
    description: str | None = None

# Public contact info shown on portfolio site
class PublicContact(APIModel):
    email: EmailStr | None = None
    phone: Phone | None = None
    linkedin: StrictStr | None = None
    github: StrictStr | None = None


# Create a new portfolio site
class PortfolioSiteCreate(APIModel):
    slug: Slug
    custom_domain: str | None = None
    theme_key: str = "neo-dark"
    theme_version: str = "1.0.0"
    seo: SEOConfig | None = None
    public_contact: PublicContact | None = None
    content: dict[str, str] | None = None

# Update an existing portfolio site
class PortfolioSiteUpdate(APIModel):
    slug: Slug | None = None
    custom_domain: str | None = None
    theme_key: str | None = None
    theme_version: str | None = None
    status: PortfolioStatus | None = None
    seo: SEOConfig | None = None
    public_contact: PublicContact | None = None
    content: dict[str, str] | None = None

# Portfolio site output as it is returned
class PortfolioSiteOut(IDModel, Timestamped):
    user_id: int
    slug: Slug
    custom_domain: str | None
    theme_key: str | None
    theme_version: str
    status: PortfolioStatus
    seo: SEOConfig | None
    public_contact: PublicContact | None
    content: dict[str, str] | None
    last_published_at: datetime | None = None
    build_version: int
    updated_at: datetime

# A build record for a portfolio site
class SiteBuildOut(IDModel, APIModel):
    site_id: int
    status: str
    logs: str | None = None
    created_at: datetime
    duration_ms: int | None = None

# ---------------------- Draft (חדש ל-PC-64) ----------------------

# Legal section names (keep this list centralized / single source of truth)
# NOTE: Using a Literal limits valid values at type-check time and improves editor autocomplete.
SectionName = Literal["about", "projects", "skills", "experience", "education", "contact"]


class AboutDTO(APIModel):
    """DTO representing the 'About' section content of a portfolio draft."""
    text: StrictStr | None = None


class ContactDTO(APIModel):
    """
    DTO for contact information displayed in the portfolio.

    Notes:
      - `EmailStr` enforces RFC-compliant email format.
      - `Phone` is assumed to be a custom validated type for phone numbers.
    """
    email: EmailStr | None = None
    phone: Phone | None = None
    website: StrictStr | None = None
    github: StrictStr | None = None
    linkedin: StrictStr | None = None


class SectionsVisibilityDTO(APIModel):
    """
    DTO controlling the visibility of each portfolio section.

    All fields default to True (section visible) unless explicitly set to False.
    """
    about: bool | None = True
    projects: bool | None = True
    skills: bool | None = True
    experience: bool | None = True
    education: bool | None = True
    contact: bool | None = True


class PortfolioDraftBase(APIModel):
    """
    Base DTO for portfolio drafts – used for both Create and Update (partial) flows.

    Important:
      - `data` is intentionally flexible and schema-light to allow per-section custom payloads.
      - `sections_order` defines the order of sections; duplicates are not allowed (validated below).
      - `sections_visibility` allows toggling sections on/off without deleting their data.
    """
    about: AboutDTO | None = None
    contact: ContactDTO | None = None
    sections_order: List[SectionName] | None = None
    sections_visibility: SectionsVisibilityDTO | None = None
    data: Dict[str, object] | None = None  # Dynamic JSON (projects/skills/experience/education, etc.)

    @staticmethod
    def ensure_unique_order(order: Optional[List[SectionName]]) -> Optional[List[SectionName]]:
        """
        Validate that `sections_order` contains no duplicate section names.

        Raises:
            ValueError: if duplicates are detected.

        Returns:
            The original order if valid, or None if not provided.
        """
        if order and len(order) != len(set(order)):
            raise ValueError("sections_order contains duplicates")
        return order


class PortfolioDraftCreate(PortfolioDraftBase):
    # All fields are optional – partial initialization is allowed.
    pass  # כל השדות אופציונליים – התחלה חלקית מותרת


class PortfolioDraftUpdate(PortfolioDraftBase):
    # Partial updates (PATCH/POST merge) – merging behavior is implemented in the service layer.
    pass  # עדכונים חלקיים (PATCH/POST מיזוג) – ימומש בלוגיקה של ה-service


class PortfolioDraftOut(PortfolioDraftBase, IDModel, Timestamped):
    """
    The persisted portfolio draft object as stored in the database.

    Inherits:
      - `PortfolioDraftBase` for content/structure.
      - `IDModel` for primary key handling.
      - `Timestamped` for created/updated timestamps.
    """
    user_id: int
    version: int
