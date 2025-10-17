# app/features/portfolios/service_draft.py
"""
Service layer for Portfolio Draft.

Responsibilities:
- Seed a draft from parsed resume JSON (PC-65).
- Load the active draft for a user (single active draft per user).
- Partial update with deep-merge semantics (PC-66).
- Lightweight mapping from parser JSON -> editor-friendly draft payload.
"""

from __future__ import annotations

from copy import deepcopy
from typing import Any, Iterable

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models_portfolio import PortfolioDraft
from app.features.portfolios.schemas_draft import (
    PortfolioDraftUpdate,
    PortfolioDraftOut,
    SectionName,
)

# Valid section names (kept in one place to validate client input)
# NOTE: This tuple acts as an allow-list for sections the editor/renderers understand.
# Validation against this helps catch typos or unsupported sections early.
VALID_SECTIONS: tuple[SectionName, ...] = (
    "summary", "projects", "skills", "experience", "education", "contact"
)


class PortfolioDraftService:
    # ---------- Queries ----------

    @staticmethod
    async def get_active_draft(db: AsyncSession, *, user_id: int) -> PortfolioDraft | None:
        """Return the single active draft for the given user (or None)."""
        # We keep exactly one active draft per user. If not found, return None.
        stmt = (
            select(PortfolioDraft)
            .where(
                PortfolioDraft.user_id == user_id,
                PortfolioDraft.is_active.is_(True),
            )
            .limit(1)
        )
        res = await db.execute(stmt)
        return res.scalars().first()

    # ---------- PC-65: seed from parsed resume ----------

    @staticmethod
    async def seed_from_parsed(
        db: AsyncSession,
        *,
        user_id: int,
        parsed_resume: dict[str, Any],
        resume_source_id: int | None = None,
    ) -> PortfolioDraft:
        """
        Create or replace the active draft content from a parsed resume JSON.
        Idempotent per user: if a draft exists, we overwrite its content and reset version to 1.
        """
        # Convert third-party parser output into our draft wire-shape.
        mapped = PortfolioDraftService._map_parsed_to_draft_payload(parsed_resume, resume_source_id)

        # Ensure a single active draft per user; create if one doesn't exist.
        draft = await PortfolioDraftService.get_active_draft(db, user_id=user_id)
        if draft is None:
            draft = PortfolioDraft(user_id=user_id)

        # Assign mapped fields; these mirror the public API fields used by the editor UI.
        draft.resume_source_id = mapped.get("resume_source_id")
        draft.about = mapped.get("about")
        draft.contact = mapped.get("contact")
        draft.sections_order = mapped.get("sections_order")
        draft.sections_visibility = mapped.get("sections_visibility")
        draft.data = mapped.get("data")
        draft.version = 1  # restart versioning on re-seed

        # Persist and refresh to materialize DB-side defaults (timestamps, IDs, etc.).
        db.add(draft)
        await db.commit()
        await db.refresh(draft)
        return draft

    # ---------- PC-66: partial update (deep-merge) ----------

    @staticmethod
    async def update_partial(
        db: AsyncSession,
        *,
        user_id: int,
        patch: dict[str, Any],
        bump_version: bool = True,
    ) -> PortfolioDraft:
        """
        Apply partial updates:
        - dict fields (about/contact/data/sections_visibility): deep-merge
        - sections_order: replace (validated)
        """
        # Fetch current active draft; if none exists yet, create a minimal baseline.
        draft = await PortfolioDraftService.get_active_draft(db, user_id=user_id)
        if draft is None:
            # Create baseline if user never seeded
            draft = PortfolioDraft(user_id=user_id)
            db.add(draft)
            await db.flush()

        # Deep-merge JSON fields
        # For dict-like fields, we merge keys recursively so clients can PATCH small parts
        # without having to send the entire object (safer and bandwidth-friendly).
        if "about" in patch:
            draft.about = PortfolioDraftService._deep_merge(draft.about, patch["about"])
        if "contact" in patch:
            draft.contact = PortfolioDraftService._deep_merge(draft.contact, patch["contact"])
        if "data" in patch:
            draft.data = PortfolioDraftService._deep_merge(draft.data, patch["data"])
        if "sections_visibility" in patch:
            draft.sections_visibility = PortfolioDraftService._deep_merge(
                draft.sections_visibility, patch["sections_visibility"]
            )

        # Replace list (validated)
        # The order is positional/meaningful, so we treat it as atomic and validate all entries.
        if "sections_order" in patch and patch["sections_order"] is not None:
            draft.sections_order = PortfolioDraftService._validate_sections_order(patch["sections_order"])

        # Bump version to support optimistic UI and cache invalidation semantics.
        if bump_version:
            draft.version = (draft.version or 1) + 1

        await db.commit()
        await db.refresh(draft)
        return draft

    # ---------- Out serializer ----------

    @staticmethod
    def to_out(draft: PortfolioDraft) -> PortfolioDraftOut:
        """Serialize ORM -> API out model."""
        # Keep serialization explicit to avoid coupling to ORM field names by accident.
        return PortfolioDraftOut(
            id=draft.id,
            user_id=draft.user_id,
            resume_source_id=draft.resume_source_id,
            about=draft.about,
            contact=draft.contact,
            sections_order=draft.sections_order,
            sections_visibility=draft.sections_visibility,
            data=draft.data,
            version=draft.version,
            is_active=draft.is_active,
            created_at=draft.created_at,
            updated_at=draft.updated_at,
        )

    # ---------- Internal helpers ----------

    @staticmethod
    def _deep_merge(base: Any, delta: Any) -> Any:
        """
        Recursively merge delta into base.
        - dict: key-wise merge
        - list: replace wholesale
        - scalars/None: replace if delta is not None
        """
        # Short-circuit when either side is None.
        if base is None:
            return deepcopy(delta)
        if delta is None:
            return base

        # Dicts -> recursive merge by keys.
        if isinstance(base, dict) and isinstance(delta, dict):
            out = dict(base)
            for k, v in delta.items():
                out[k] = PortfolioDraftService._deep_merge(out.get(k), v)
            return out

        # Lists -> we currently choose replacement semantics (no per-index patching).
        if isinstance(base, list) and isinstance(delta, list):
            return deepcopy(delta)

        # Scalars (or type-mismatched) -> choose delta (last-writer-wins).
        return deepcopy(delta)

    @staticmethod
    def _map_parsed_to_draft_payload(parsed: dict[str, Any], resume_source_id: int | None) -> dict[str, Any]:
        """
        Map parser output -> draft payload the editor understands.
        Expected input (abridged): { "data": { "extractedData": { "parsed": {...} } } }

        The goal is to normalize potentially messy parser output into a predictable, editor-friendly
        structure without enforcing a rigid schema on the parser’s internals.
        """
        # Safe digs with defaults to avoid KeyError if parser output shifts slightly.
        p = (parsed or {}).get("data", {}).get("extractedData", {}).get("parsed", {})  # safe digs
        name = p.get("name")
        about_text = p.get("about")
        email = p.get("email")
        phone = p.get("phone")
        linkedin = p.get("linkedin")
        github = p.get("github")

        # Normalize flexible arrays/dicts to the shapes used by the editor.
        projects = _coerce_projects(p.get("projects"))
        experience = _coerce_list_of_dicts(p.get("experience"))
        education = _coerce_list_of_dicts(p.get("education"))
        skills = _coerce_skills(p.get("skills"))
        languages = _coerce_languages(p.get("skills"))

        # Construct the canonical payload used by the UI.
        payload = {
            "resume_source_id": resume_source_id,
            "about": {"text": about_text} if about_text else None,
            "contact": {
                "email": email, "phone": phone, "linkedin": linkedin, "github": github
            },
            "sections_order": ["summary", "projects", "skills", "experience", "education", "contact"],
            "sections_visibility": {
                "summary": True, "projects": True, "skills": True,
                "experience": True, "education": True, "contact": True,
            },
            "data": {
                "summary": {
                    "name": name,
                    "about": about_text,
                    "headline": None,
                },
                "projects": projects,
                "skills": skills,
                "experience": experience,
                "education": education,
                "languages": languages,
            },
        }
        # Strip None branches to keep the stored JSON compact and diff-friendly.
        return _strip_none(payload)

    @staticmethod
    def _validate_sections_order(order: Iterable[str]) -> list[str]:
        """Ensure values are known and no duplicates. Preserve client order."""
        # We accept only allowed section identifiers and remove duplicates while preserving order.
        clean: list[str] = []
        seen: set[str] = set()
        for s in order or []:
            if s not in VALID_SECTIONS:
                raise ValueError(f"invalid section name: {s!r}")
            if s in seen:
                continue
            clean.append(s)
            seen.add(s)
        return clean


# ---------- tiny pure utils (outside the class) ----------

def _strip_none(obj: Any) -> Any:
    """Drop None branches to keep JSON lean (helps diffs & payload size)."""
    if isinstance(obj, dict):
        return {k: _strip_none(v) for k, v in obj.items() if v is not None}
    if isinstance(obj, list):
        return [_strip_none(x) for x in obj if x is not None]
    return obj


def _coerce_list_of_dicts(val: Any) -> list[dict]:
    """
    Normalize a value to a list of dicts:
    - If input is a list, filter to dict items only.
    - Otherwise, return an empty list.
    """
    if not val:
        return []
    if isinstance(val, list):
        return [x for x in val if isinstance(x, dict)]
    return []


def _coerce_projects(val: Any) -> list[dict]:
    """
    Normalize projects:
    - dict -> wrap as single-item list
    - list[dict] -> keep as-is (filtered)
    - otherwise -> empty list
    """
    if not val:
        return []
    if isinstance(val, list):
        return [x for x in val if isinstance(x, dict)]
    if isinstance(val, dict):
        return [val]
    return []


def _coerce_skills(val: Any) -> dict:
    """
    Normalize skills into a structured dict the editor expects.
    Examples:
    - list -> {"core": ["Python", "SQL", ...]}
    - dict -> pass through (already structured)
    - other -> {}
    """
    if isinstance(val, list):
        return {"core": [str(x) for x in val]}
    if isinstance(val, dict):
        return val
    return {}


def _coerce_languages(val: Any) -> list[str]:
    """
    Extract supported languages from a list-like skills field.
    For now we only surface commonly used "Hebrew"/"English" to keep the UI simple.
    """
    if isinstance(val, list):
        return [s for s in val if isinstance(s, str) and ("Hebrew" in s or "English" in s)]
    return []
