# app/features/portfolios/routes_draft.py
from typing import Any
import json
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field

from app.core.db import get_db  # ✅ Real dependency injection for database session
from app.db.models_resume import Resume
from app.features.portfolios.schemas_draft import PortfolioDraftUpdate, PortfolioDraftOut
from app.features.portfolios.service_draft import PortfolioDraftService
from app.features.portfolios.service_publish import PortfolioPublishService


# --- Simulated current user (header-based stub for local testing) ---
class _User:
    """A simple user model used only for local testing (no authentication system involved)."""

    def __init__(self, id: int):
        self.id = id


async def get_current_user(x_user_id: int | None = Header(None)) -> _User:
    """
    Dependency function to simulate an authenticated user by reading the `X-User-Id` header.

    If no header is provided, defaults to user ID = 1.
    This allows testing user-specific portfolio behavior without real authentication.
    """
    return _User(id=x_user_id or 1)


# --- Router setup ---
router = APIRouter(prefix="/api/v1/portfolio/draft", tags=["portfolio-draft"])


# --- Request schema for seeding draft ---
class DraftSeedRequest(BaseModel):
    """
    Request model for initializing (seeding) a portfolio draft.

    Attributes:
        parsed_resume: Raw parsed resume JSON (if directly provided by client).
        resume_source_id: ID of an existing resume to load parsed data from.
    """
    parsed_resume: dict[str, Any] | None = Field(default=None)
    resume_source_id: int | None = Field(default=None)


# --- Request schema for publishing draft ---
class PublishRequest(BaseModel):
    """
    Request model for publishing a portfolio draft.

    Attributes:
        custom_slug: Optional custom slug for the portfolio URL.
    """
    custom_slug: str | None = Field(default=None, max_length=50, description="Custom URL slug")


# --- Response schema for published portfolio ---
class PublishedPortfolioResponse(BaseModel):
    """
    Response model for published portfolio.
    """
    id: int
    slug: str
    public_url: str
    status: str
    last_published_at: str
    build_version: int


def _ensure_enveloped(parsed_obj: Any) -> dict[str, Any]:
    """
    Make sure the parsed resume is in the envelope the service expects:
    { "data": { "extractedData": { "parsed": <dict> } } }

    - Accepts dict already in the right shape -> returns as-is.
    - Accepts a "flat" dict (name/email/...) -> wraps under ...parsed.
    - Accepts a JSON string -> loads and then applies the same rules.
    """
    # If it's a JSON string, try to parse
    if isinstance(parsed_obj, str):
        try:
            parsed_obj = json.loads(parsed_obj)
        except Exception:
            parsed_obj = {}

    if not isinstance(parsed_obj, dict):
        parsed_obj = {}

    # If already enveloped properly, keep it
    maybe_parsed = (
        parsed_obj.get("data", {})
        .get("extractedData", {})
        .get("parsed")
        if isinstance(parsed_obj, dict) else None
    )
    if isinstance(maybe_parsed, dict) and maybe_parsed:
        return parsed_obj  # already in the right envelope

    # Otherwise treat parsed_obj as the flat parsed payload and wrap it
    return {
        "data": {
            "extractedData": {
                "parsed": parsed_obj if isinstance(parsed_obj, dict) else {}
            }
        }
    }


@router.post("/seed", response_model=PortfolioDraftOut, status_code=status.HTTP_201_CREATED)
async def seed_draft(
        payload: DraftSeedRequest,
        db: AsyncSession = Depends(get_db),  # ✅ Injected async DB session
        user: _User = Depends(get_current_user),  # ✅ Current user simulated via header
):
    """
    Initialize (seed) a new portfolio draft from either:
    - A provided `parsed_resume` JSON payload, or
    - An existing resume record (`resume_source_id`).

    The endpoint validates input, loads the parsed data if needed,
    and delegates seeding logic to `PortfolioDraftService`.
    """
    parsed_json: dict[str, Any] | None = None
    resume_id: int | None = None

    # --- Case 1: parsed resume directly provided ---
    if payload.parsed_resume:
        parsed_json = _ensure_enveloped(payload.parsed_resume)
        resume_id = payload.resume_source_id

    # --- Case 2: resume ID provided, load parsed data from DB ---
    elif payload.resume_source_id:
        stmt = select(Resume).where(Resume.id == payload.resume_source_id)
        res = await db.execute(stmt)
        resume = res.scalars().first()
        if not resume or not resume.parsed_json:
            raise HTTPException(status_code=404, detail="Resume not found or has no parsed_json")

        # parsed_json might be a flat dict or a JSON string; normalize & envelope it
        parsed_json = _ensure_enveloped(resume.parsed_json)
        resume_id = resume.id

    # --- Case 3: invalid input ---
    else:
        raise HTTPException(status_code=422, detail="Provide either parsed_resume or resume_source_id")

    # --- Create draft based on parsed resume data ---
    draft = await PortfolioDraftService.seed_from_parsed(
        db=db,
        user_id=user.id,
        parsed_resume=parsed_json,
        resume_source_id=resume_id,
    )
    return PortfolioDraftService.to_out(draft)


@router.post("/publish", response_model=PublishedPortfolioResponse, status_code=status.HTTP_201_CREATED)
async def publish_draft(
        payload: PublishRequest,
        db: AsyncSession = Depends(get_db),
        user: _User = Depends(get_current_user),
):
    """
    Publish the active draft to a public portfolio site.

    - Validates draft completeness (about, contact, content sections)
    - Generates unique URL slug
    - Creates published site from draft data
    - Archives previous published versions
    - Returns public URL for sharing
    """
    try:
        # Delegate to service layer for publishing logic
        published_site = await PortfolioPublishService.publish_draft(
            db=db,
            user_id=user.id,
            custom_slug=payload.custom_slug,
        )

        # Generate public URL (in production, this would be your domain)
        public_url = f"https://portfolio-builder.com/portfolio/{published_site.slug}"

        return PublishedPortfolioResponse(
            id=published_site.id,
            slug=published_site.slug,
            public_url=public_url,
            status=published_site.status,
            last_published_at=published_site.last_published_at.isoformat(),
            build_version=published_site.build_version,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to publish portfolio")


@router.patch("", response_model=PortfolioDraftOut, status_code=status.HTTP_200_OK)
async def patch_draft(
        payload: PortfolioDraftUpdate,
        db: AsyncSession = Depends(get_db),
        user: _User = Depends(get_current_user),
):
    """
    Partially update an existing portfolio draft.

    - Accepts only provided (non-null) fields from the payload to avoid overwriting data unintentionally.
    - Increments version if `bump_version=True` is specified in the service.
    """
    # Convert Pydantic model to dict while excluding None fields
    patch = payload.model_dump(exclude_none=True)
    if not patch:
        raise HTTPException(status_code=400, detail="Empty patch")

    # Delegate to service layer for partial update logic
    draft = await PortfolioDraftService.update_partial(
        db=db,
        user_id=user.id,
        patch=patch,
        bump_version=True,
    )

    return PortfolioDraftService.to_out(draft)
