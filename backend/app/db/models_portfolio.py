"""
models_portfolio.py
DB models for portfolio drafts and published sites.

- PortfolioDraft: the editable working copy (draft) a user modifies before publishing.
- PortfolioSite: the published/public site snapshot aligned with PortfolioSite* schemas.
- SiteBuild: build logs/status records for publish pipeline.

Notes:
- JSONB fields keep the schema flexible and allow partial updates without frequent migrations.
- We intentionally keep draft vs published concerns separated.
"""

from datetime import datetime
from sqlalchemy import (
    BigInteger,
    Boolean,
    Integer,
    String,
    Text,
    Index,
    CheckConstraint,
    text,
    DateTime,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


# ----------------------------
# Draft (editable working copy)
# ----------------------------
class PortfolioDraft(Base):
    """
    Holds the user's editable portfolio state prior to publish.
    Keep this flexible: most content lives in JSONB to support incremental/partial edits.
    """
    __tablename__ = "portfolios_draft"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    # Access-control & common query key. Keep indexed for fast lookups.
    user_id: Mapped[int] = mapped_column(BigInteger, index=True, nullable=False)

    # Optional traceability to the resume that seeded this draft (not a hard FK by design).
    # If you ever need referential integrity, add an explicit FK with ON DELETE SET NULL.
    resume_source_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True, index=True)

    # Lightweight fixed “framing” fields kept outside data:
    # - about/contact are small blobs the UI touches often.
    about: Mapped[dict | None] = mapped_column(JSONB, nullable=True)               # e.g. { "text": "..." }
    contact: Mapped[dict | None] = mapped_column(JSONB, nullable=True)             # e.g. { "email": "...", "phone": "...", ... }

    # Page composition toggles. These let the UI reorder/hide sections without touching content.
    sections_order: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)  # e.g. ["summary","projects","skills",...]
    sections_visibility: Mapped[dict | None] = mapped_column(JSONB, nullable=True)  # e.g. { "projects": true, "contact": false }

    # Primary, flexible content blob (projects/skills/experience/education/recommendations/...).
    # Draft updates should deep-merge into this structure to avoid accidental data loss.
    data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Simple optimistic versioning for conflict detection / auditing.
    version: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("1"))

    # Soft activation flag; useful if you later support multiple drafts per user or archival.
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))

    # Server-side timestamps.
    # NOTE: text("now()") sets defaults only. If you need updated_at to change on every SQL UPDATE
    # (outside SQLAlchemy onupdate), add a DB trigger. SQLAlchemy's onupdate helps on ORM flush paths only.
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    __table_args__ = (
        # Keep version non-negative and non-zero.
        CheckConstraint("version >= 1", name="ck_portfolios_draft_version_pos"),
    )


# ----------------------------
# Published site (public view)
# ----------------------------
class PortfolioSite(Base):
    """
    Published/public site snapshot.
    This is the stable artifact the public consumes (derived from a draft at publish time).
    """
    __tablename__ = "portfolio_sites"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    # Queries frequently fan out by user; keep indexed.
    user_id: Mapped[int] = mapped_column(BigInteger, index=True, nullable=False)

    # Routing. Slug must be unique; custom_domain is optional and validated at the app layer.
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    custom_domain: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Theme metadata pinned at publish time so the snapshot is reproducible.
    theme_key: Mapped[str | None] = mapped_column(String(50), nullable=True)
    theme_version: Mapped[str] = mapped_column(String(20), nullable=False, server_default=text("'1.0.0'"))

    # Keep as string for DB simplicity; app-level enum validates values (draft/built/published/...).
    # If you prefer strictness at DB-level, switch to a native Enum type.
    status: Mapped[str] = mapped_column(String(30), nullable=False, server_default=text("'draft'"))

    # SEO + public contacts for the published site.
    seo: Mapped[dict | None] = mapped_column(JSONB, nullable=True)                 # { "title": "...", "description": "..." }
    public_contact: Mapped[dict | None] = mapped_column(JSONB, nullable=True)      # { "email": "...", "linkedin": "...", ... }

    # Final rendered content snapshot (already filtered by visibility rules).
    content: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Audit/build metadata.
    last_published_at: Mapped[datetime | None] = mapped_column(nullable=True)
    build_version: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("1"))

    # Same timestamp caveat as above re: onupdate triggers.
    created_at: Mapped[datetime] = mapped_column(server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(server_default=text("now()"), onupdate=text("now()"), nullable=False)

    __table_args__ = (
        Index("ix_portfolio_sites_user", "user_id"),
        Index("ux_portfolio_sites_slug", "slug", unique=True),
        CheckConstraint("build_version >= 1", name="ck_portfolio_sites_build_version_pos"),
    )


# ----------------------------
# Build records (publish pipeline)
# ----------------------------
class SiteBuild(Base):
    """
    A lightweight log of site build executions (queue/run/success/failure),
    useful for troubleshooting and user-facing build history.
    """
    __tablename__ = "site_builds"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    # Keep a simple denormalized index; we don't FK on purpose to avoid tight coupling.
    site_id: Mapped[int] = mapped_column(BigInteger, index=True, nullable=False)

    # Consider constraining status to a known set at app layer (or DB Enum if you want strictness).
    status: Mapped[str] = mapped_column(String(30), nullable=False)  # e.g. "queued|running|success|failed"

    # Build logs are text; if logs may grow large, consider external storage and store a reference.
    logs: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Duration in milliseconds (nullable for in-progress/failed runs without a total).
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(server_default=text("now()"), nullable=False)

    __table_args__ = (
        Index("ix_site_builds_site", "site_id"),
    )
