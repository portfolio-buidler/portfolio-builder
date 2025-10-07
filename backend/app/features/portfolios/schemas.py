from datetime import datetime
from typing import Annotated
from pydantic import EmailStr, Field, StrictStr, StringConstraints, constr
from app.shared.schemas import APIModel, IDModel, Timestamped
from app.shared.enums import PortfolioStatus

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
