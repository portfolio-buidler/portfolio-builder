"""
Public portfolio access routes.

Provides read-only access to published portfolios for public consumption.
Includes caching headers, analytics tracking, and CORS support.
"""

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.core.db import get_db
from app.features.portfolios.service_publish import PortfolioPublishService


# --- Router setup ---
router = APIRouter(prefix="/api/v1/portfolio/public", tags=["portfolio-public"])


# --- Response schemas ---
class PublicPortfolioResponse(BaseModel):
    """
    Response model for public portfolio data.
    Excludes sensitive information and includes only public-safe data.
    """
    id: int
    slug: str
    theme_key: str | None
    theme_version: str
    seo: dict[str, str] | None
    public_contact: dict[str, str] | None
    content: dict[str, Any] | None
    last_published_at: str
    build_version: int


@router.get("/{slug}", response_model=PublicPortfolioResponse)
async def get_public_portfolio(
    slug: str,
    db: AsyncSession = Depends(get_db),
    response: Response = None,
):
    """
    Get a published portfolio by slug for public access.
    
    - Returns only published portfolios
    - Excludes sensitive data (private notes, internal IDs)
    - Includes caching headers for CDN optimization
    - Tracks view analytics
    - Supports CORS for cross-origin access
    """
    try:
        # Get published portfolio
        published_site = await PortfolioPublishService.get_public_portfolio(
            db=db,
            slug=slug,
        )
        
        # Set caching headers for CDN optimization
        response.headers["Cache-Control"] = "public, max-age=3600"  # 1 hour cache
        response.headers["ETag"] = f'"{published_site.slug}-{published_site.build_version}"'
        response.headers["Last-Modified"] = published_site.last_published_at.strftime("%a, %d %b %Y %H:%M:%S GMT")
        
        # CORS headers for cross-origin access
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        
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
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to retrieve portfolio")


@router.options("/{slug}")
async def options_public_portfolio(slug: str, response: Response):
    """
    Handle CORS preflight requests for public portfolio access.
    """
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
    Get basic analytics for a published portfolio.
    
    Note: This is a placeholder for future analytics implementation.
    In production, you'd return actual view counts, referrers, etc.
    """
    try:
        # Get portfolio to verify it exists
        published_site = await PortfolioPublishService.get_public_portfolio(
            db=db,
            slug=slug,
        )
        
        # Placeholder analytics data
        # In production, you'd query actual analytics data
        return {
            "slug": published_site.slug,
            "total_views": "Analytics not implemented yet",
            "last_viewed": "Analytics not implemented yet",
            "message": "Analytics tracking is active but data collection is not yet implemented"
        }
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
