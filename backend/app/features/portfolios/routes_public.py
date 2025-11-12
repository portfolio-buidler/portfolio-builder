"""
Public portfolio access routes.

Provides read-only access to published portfolios for public consumption.
Includes caching headers, analytics tracking (with IP/day de-dup), and CORS support.
"""

from typing import Any
import os
import hashlib

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.db import get_db
from app.features.portfolios.service_publish import PortfolioPublishService

# --- Router setup ---
router = APIRouter(prefix="/api/v1/portfolio/public", tags=["portfolio-public"])

# --- Config ---
ANALYTICS_SALT = os.getenv("ANALYTICS_SALT", "dev-salt")


# --- Response schemas (pydantic) ---
from pydantic import BaseModel

class PublicPortfolioResponse(BaseModel):
    """
    Response model for public portfolio data.
    Excludes sensitive information and includes only public-safe data.
    """
    id: int
    slug: str
    theme_key: str | None
    theme_version: str
    seo: dict[str, Any] | None
    public_contact: dict[str, str] | None
    content: dict[str, Any] | None
    last_published_at: str
    build_version: int


# --- Analytics helper ---
async def _track_public_view(db: AsyncSession, site_id: int, request: Request) -> None:
    """
    Insert a view row with daily IP de-dup (1 view per IP per day per site).
    We store only a salted hash of the IP for privacy (GDPR-friendly).
    """
    try:
        # Get client IP (supports proxy)
        ip_raw = request.headers.get("x-forwarded-for", "") or (request.client.host or "0.0.0.0")
        ip = ip_raw.split(",")[0].strip()
        ip_hash = hashlib.sha256(f"{ANALYTICS_SALT}:{ip}".encode("utf-8")).hexdigest()

        referrer = request.headers.get("referer")
        user_agent = request.headers.get("user-agent")

        # Insert with ON CONFLICT (site_id, ip_hash, viewed_on) DO NOTHING
        await db.execute(text("""
            INSERT INTO site_views (site_id, viewed_at, viewed_on, ip_hash, referrer, user_agent)
            VALUES (:sid, NOW(), CURRENT_DATE, :ip_hash, :referrer, :ua)
            ON CONFLICT (site_id, ip_hash, viewed_on) DO NOTHING
        """), {"sid": site_id, "ip_hash": ip_hash, "referrer": referrer, "ua": user_agent})
        await db.commit()
    except Exception:
        # Never break the public read due to analytics issues
        await db.rollback()


# --- Routes ---

@router.get("/{slug}", response_model=PublicPortfolioResponse)
async def get_public_portfolio(
    slug: str,
    db: AsyncSession = Depends(get_db),
    response: Response = None,
    request: Request = None,
):
    """
    Get a published portfolio by slug for public access.

    - Returns only published portfolios
    - Excludes sensitive data (private notes, internal IDs)
    - Includes caching headers for CDN optimization
    - Tracks view analytics with daily IP de-dup
    - Supports CORS for cross-origin access
    """
    try:
        # Get published portfolio (raises ValueError if not found)
        published_site = await PortfolioPublishService.get_public_portfolio(
            db=db,
            slug=slug,
        )

        # Caching headers (tune in production)
        response.headers["Cache-Control"] = "public, max-age=3600"
        response.headers["ETag"] = f'"{published_site.slug}-{published_site.build_version}"'
        response.headers["Last-Modified"] = published_site.last_published_at.strftime("%a, %d %b %Y %H:%M:%S GMT")

        # CORS headers
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"

        # Track view (non-blocking in terms of user experience)
        await _track_public_view(db=db, site_id=published_site.id, request=request)

        return PublicPortfolioResponse(
            id=published_site.id,
            slug=published_site.slug,
            theme_key=published_site.theme_key,
            theme_version=published_site.theme_version,
            seo=published_site.seo,
            public_contact=published_site.public_contact,
            content=published_site.content,
            last_published_at=published_site.last_published_at.isoformat(),
            build_version=published_site.build_version,
        )

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to retrieve portfolio")


@router.options("/{slug}")
async def options_public_portfolio(slug: str, response: Response):
    """Handle CORS preflight requests for public portfolio access."""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Max-Age"] = "86400"  # 24 hours
    return {"message": "CORS preflight"}


@router.get("/{slug}/analytics")
async def get_portfolio_analytics(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Basic analytics for a published portfolio.
    Returns total views, unique views (by ip/day hash), last viewed at, and a 14-day daily series.
    """
    try:
        site = await PortfolioPublishService.get_public_portfolio(db=db, slug=slug)

        total = (await db.execute(text("""
            SELECT COUNT(*) FROM site_views WHERE site_id = :sid
        """), {"sid": site.id})).scalar_one()

        uniques = (await db.execute(text("""
            SELECT COUNT(DISTINCT ip_hash)
            FROM site_views
            WHERE site_id = :sid AND ip_hash IS NOT NULL
        """), {"sid": site.id})).scalar_one()

        last_viewed = (await db.execute(text("""
            SELECT MAX(viewed_at) FROM site_views WHERE site_id = :sid
        """), {"sid": site.id})).scalar_one()

        rows = (await db.execute(text("""
            SELECT viewed_on AS day, COUNT(*) AS views
            FROM site_views
            WHERE site_id = :sid AND viewed_on >= CURRENT_DATE - INTERVAL '13 days'
            GROUP BY viewed_on
            ORDER BY day
        """), {"sid": site.id})).mappings().all()

        return {
            "slug": site.slug,
            "total_views": int(total or 0),
            "unique_views": int(uniques or 0),
            "last_viewed": last_viewed.isoformat() if last_viewed else None,
            "views_by_day": [{"day": r["day"].isoformat(), "views": int(r["views"])} for r in rows],
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
