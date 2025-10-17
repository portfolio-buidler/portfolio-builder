# app/features/portfolios/routes_draft.py
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field

from app.core.db import get_db                       # ✅ Real dependency injection for database session
from app.db.models_resume import Resume
from app.features.portfolios.schemas_draft import PortfolioDraftUpdate, PortfolioDraftOut
from app.features.portfolios.service_draft import PortfolioDraftService


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


@router.post("/seed", response_model=PortfolioDraftOut, status_code=status.HTTP_201_CREATED)
async def seed_draft(
    payload: DraftSeedRequest,
    db: AsyncSession = Depends(get_db),              # ✅ Injected async DB session
    user: _User = Depends(get_current_user),         # ✅ Current user simulated via header
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
        parsed_json = payload.parsed_resume
        resume_id = payload.resume_source_id

    # --- Case 2: resume ID provided, load parsed data from DB ---
    elif payload.resume_source_id:
        stmt = select(Resume).where(Resume.id == payload.resume_source_id)
        res = await db.execute(stmt)
        resume = res.scalars().first()
        if not resume or not resume.parsed_json:
            raise HTTPException(status_code=404, detail="Resume not found or has no parsed_json")
        parsed_json = resume.parsed_json
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
