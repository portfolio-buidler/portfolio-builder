"""
Service layer for Portfolio Publishing.

Responsibilities:
- Publish draft to public site (PC-67)
- Generate unique slugs
- Handle version management
- Analytics tracking
"""

from __future__ import annotations
import re
import secrets
from datetime import datetime
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models_portfolio import PortfolioDraft, PortfolioSite
from app.features.portfolios.schemas_draft import PortfolioDraftOut


class PortfolioPublishService:
    """Service for publishing portfolio drafts to public sites."""
    
    @staticmethod
    async def publish_draft(
        db: AsyncSession,
        *,
        user_id: int,
        custom_slug: str | None = None,
    ) -> PortfolioSite:
        """
        Publish the active draft for a user to a public site.
        
        Args:
            db: Database session
            user_id: User ID
            custom_slug: Optional custom slug (will be validated and made unique)
            
        Returns:
            Published PortfolioSite
            
        Raises:
            ValueError: If no active draft exists or draft is incomplete
        """
        # Get active draft
        draft = await PortfolioPublishService._get_active_draft(db, user_id)
        if not draft:
            raise ValueError("No active draft found for user")
        
        # Validate draft completeness
        PortfolioPublishService._validate_draft_completeness(draft)
        
        # Generate or validate slug
        slug = await PortfolioPublishService._generate_slug(
            db, user_id, custom_slug or PortfolioPublishService._generate_default_slug(user_id)
        )
        
        # Invalidate previous published version
        await PortfolioPublishService._invalidate_previous_published(db, user_id)
        
        # Create published site
        published_site = await PortfolioPublishService._create_published_site(
            db, draft, slug, user_id
        )
        
        return published_site
    
    @staticmethod
    async def get_public_portfolio(
        db: AsyncSession,
        *,
        slug: str,
    ) -> PortfolioSite:
        """
        Get a published portfolio by slug.
        
        Args:
            db: Database session
            slug: Portfolio slug
            
        Returns:
            Published PortfolioSite
            
        Raises:
            ValueError: If portfolio not found or not published
        """
        stmt = (
            select(PortfolioSite)
            .where(
                PortfolioSite.slug == slug,
                PortfolioSite.status == "published"
            )
            .limit(1)
        )
        result = await db.execute(stmt)
        site = result.scalars().first()
        
        if not site:
            raise ValueError("Portfolio not found or not published")
        
        # Increment view count (analytics)
        await PortfolioPublishService._increment_view_count(db, site.id)
        
        return site
    
    @staticmethod
    async def get_user_published_portfolios(
        db: AsyncSession,
        *,
        user_id: int,
    ) -> list[PortfolioSite]:
        """Get all published portfolios for a user."""
        stmt = (
            select(PortfolioSite)
            .where(PortfolioSite.user_id == user_id)
            .order_by(PortfolioSite.last_published_at.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())
    
    # ---------- Private Helper Methods ----------
    
    @staticmethod
    async def _get_active_draft(db: AsyncSession, user_id: int) -> PortfolioDraft | None:
        """Get the active draft for a user."""
        stmt = (
            select(PortfolioDraft)
            .where(
                PortfolioDraft.user_id == user_id,
                PortfolioDraft.is_active.is_(True)
            )
            .limit(1)
        )
        result = await db.execute(stmt)
        return result.scalars().first()
    
    @staticmethod
    def _validate_draft_completeness(draft: PortfolioDraft) -> None:
        """Validate that draft has minimum required content."""
        if not draft.about or not draft.about.get("text"):
            raise ValueError("Draft must have an 'about' section")
        
        if not draft.contact or not draft.contact.get("email"):
            raise ValueError("Draft must have contact email")
        
        if not draft.data:
            raise ValueError("Draft must have content data")
        
        # Check for at least one content section
        content_sections = ["projects", "experience", "education", "skills"]
        has_content = any(
            draft.data.get(section) for section in content_sections
        )
        if not has_content:
            raise ValueError("Draft must have at least one content section (projects, experience, education, or skills)")
    
    @staticmethod
    def _generate_default_slug(user_id: int) -> str:
        """Generate a default slug based on user ID."""
        # For now, use user ID. In production, you'd use actual username
        return f"user-{user_id}-portfolio"
    
    @staticmethod
    async def _generate_slug(
        db: AsyncSession,
        user_id: int,
        base_slug: str,
    ) -> str:
        """
        Generate a unique slug, making it URL-safe and unique.
        
        Args:
            db: Database session
            user_id: User ID
            base_slug: Base slug to work with
            
        Returns:
            Unique, URL-safe slug
        """
        # Clean and validate slug
        slug = PortfolioPublishService._clean_slug(base_slug)
        
        # Check if slug is already taken
        is_unique = await PortfolioPublishService._is_slug_unique(db, slug)
        
        if is_unique:
            return slug
        
        # Add suffix to make unique
        counter = 1
        while True:
            unique_slug = f"{slug}-{counter}"
            if await PortfolioPublishService._is_slug_unique(db, unique_slug):
                return unique_slug
            counter += 1
    
    @staticmethod
    def _clean_slug(slug: str) -> str:
        """Clean and validate slug for URL safety."""
        # Convert to lowercase
        slug = slug.lower()
        
        # Replace spaces and special chars with hyphens
        slug = re.sub(r'[^a-z0-9\-]', '-', slug)
        
        # Remove multiple consecutive hyphens
        slug = re.sub(r'-+', '-', slug)
        
        # Remove leading/trailing hyphens
        slug = slug.strip('-')
        
        # Ensure minimum length
        if len(slug) < 3:
            slug = f"portfolio-{secrets.token_hex(4)}"
        
        # Ensure maximum length
        if len(slug) > 50:
            slug = slug[:50].rstrip('-')
        
        return slug
    
    @staticmethod
    async def _is_slug_unique(db: AsyncSession, slug: str) -> bool:
        """Check if slug is unique in the database."""
        stmt = select(PortfolioSite.id).where(PortfolioSite.slug == slug).limit(1)
        result = await db.execute(stmt)
        return result.scalars().first() is None
    
    @staticmethod
    async def _invalidate_previous_published(db: AsyncSession, user_id: int) -> None:
        """Mark previous published portfolios as inactive."""
        stmt = (
            update(PortfolioSite)
            .where(
                PortfolioSite.user_id == user_id,
                PortfolioSite.status == "published"
            )
            .values(status="archived")
        )
        await db.execute(stmt)
    
    @staticmethod
    async def _create_published_site(
        db: AsyncSession,
        draft: PortfolioDraft,
        slug: str,
        user_id: int,
    ) -> PortfolioSite:
        """Create a published site from a draft."""
        # Transform draft data to published format
        published_content = PortfolioPublishService._transform_draft_to_published(draft)
        
        # Create published site
        published_site = PortfolioSite(
            user_id=user_id,
            slug=slug,
            status="published",
            theme_key="default",
            theme_version="1.0.0",
            seo=PortfolioPublishService._generate_seo_data(draft),
            public_contact=PortfolioPublishService._sanitize_contact_for_public(draft.contact),
            content=published_content,
            last_published_at=datetime.utcnow(),
            build_version=1,
        )
        
        db.add(published_site)
        await db.commit()
        await db.refresh(published_site)
        
        return published_site
    
    @staticmethod
    def _transform_draft_to_published(draft: PortfolioDraft) -> dict[str, Any]:
        """Transform draft data to published format."""
        if not draft.data:
            return {}
        
        published_content = {}
        
        # Copy visible sections only
        sections_visibility = draft.sections_visibility or {}
        
        for section_name, section_data in draft.data.items():
            if sections_visibility.get(section_name, True):
                published_content[section_name] = section_data
        
        # Add about section
        if draft.about and sections_visibility.get("summary", True):
            published_content["summary"] = {
                "name": draft.data.get("summary", {}).get("name"),
                "about": draft.about.get("text"),
                "headline": draft.data.get("summary", {}).get("headline"),
            }
        
        return published_content
    
    @staticmethod
    def _generate_seo_data(draft: PortfolioDraft) -> dict[str, str]:
        """Generate SEO metadata from draft."""
        name = draft.data.get("summary", {}).get("name", "Portfolio")
        about = draft.about.get("text", "") if draft.about else ""
        
        return {
            "title": f"{name} - Portfolio",
            "description": about[:160] if about else f"Professional portfolio of {name}",
        }
    
    @staticmethod
    def _sanitize_contact_for_public(contact: dict | None) -> dict[str, str]:
        """Sanitize contact info for public display."""
        if not contact:
            return {}
        
        public_contact = {}
        
        # Only include public-safe contact methods
        safe_fields = ["email", "linkedin", "github", "website"]
        for field in safe_fields:
            if contact.get(field):
                public_contact[field] = contact[field]
        
        return public_contact
    
    @staticmethod
    async def _increment_view_count(db: AsyncSession, site_id: int) -> None:
        """Increment view count for analytics."""
        # For now, just log. In production, you'd store in analytics table
        print(f"📊 Portfolio view: site_id={site_id}, timestamp={datetime.utcnow()}")
        
        # Future: Store in analytics table
        # analytics = PortfolioAnalytics(site_id=site_id, event_type="view", timestamp=datetime.utcnow())
        # db.add(analytics)
        # await db.commit()
