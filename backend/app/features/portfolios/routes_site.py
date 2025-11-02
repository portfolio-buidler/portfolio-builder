from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.db.models_portfolio import PortfolioSite
from app.features.portfolios.schemas import PortfolioSiteOut

router = APIRouter(prefix="/api/v1/portfolio/sites", tags=["portfolio-site"])

@router.get("/{slug}", response_model=PortfolioSiteOut)
async def get_site_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    stmt = select(PortfolioSite).where(PortfolioSite.slug == slug)
    res = await db.execute(stmt)
    site = res.scalars().first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    return PortfolioSiteOut(
        id=site.id,
        user_id=site.user_id,
        slug=site.slug,
        custom_domain=site.custom_domain,
        theme_key=site.theme_key,
        theme_version=site.theme_version,
        status=site.status,
        seo=site.seo,
        public_contact=site.public_contact,
        content=site.content,
        last_published_at=site.last_published_at,
        build_version=site.build_version,
        updated_at=site.updated_at,
        created_at=site.created_at,
    )
