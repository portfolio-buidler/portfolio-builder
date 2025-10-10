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

# שמות סקשנים חוקיים (שמור את הרשימה במקום אחד)
SectionName = Literal["about", "projects", "skills", "experience", "education", "contact"]

class AboutDTO(APIModel):
    text: StrictStr | None = None

class ContactDTO(APIModel):
    email: EmailStr | None = None
    phone: Phone | None = None
    website: StrictStr | None = None
    github: StrictStr | None = None
    linkedin: StrictStr | None = None

class SectionsVisibilityDTO(APIModel):
    about: bool | None = True
    projects: bool | None = True
    skills: bool | None = True
    experience: bool | None = True
    education: bool | None = True
    contact: bool | None = True

class PortfolioDraftBase(APIModel):
    """
    Base DTO לדראפט – משמש גם ל-Create וגם ל-Update (Partial).
    שים לב: data הוא מבנה גמיש לפי סקשן, ולא מחויב לסכימה קשיחה.
    """
    about: AboutDTO | None = None
    contact: ContactDTO | None = None
    sections_order: List[SectionName] | None = None
    sections_visibility: SectionsVisibilityDTO | None = None
    data: Dict[str, object] | None = None  # JSON דינמי (projects/skills/experience/education וכו')

    @staticmethod
    def ensure_unique_order(order: Optional[List[SectionName]]) -> Optional[List[SectionName]]:
        if order and len(order) != len(set(order)):
            raise ValueError("sections_order contains duplicates")
        return order

class PortfolioDraftCreate(PortfolioDraftBase):
    pass  # כל השדות אופציונליים – התחלה חלקית מותרת

class PortfolioDraftUpdate(PortfolioDraftBase):
    pass  # עדכונים חלקיים (PATCH/POST מיזוג) – ימומש בלוגיקה של ה-service

class PortfolioDraftOut(PortfolioDraftBase, IDModel, Timestamped):
    """
    אובייקט דראפט כפי שנשמר בבסיס הנתונים.
    """
    user_id: int
    version: int