"""
Integration tests for portfolio draft and publish services.

Tests cover:
- Draft creation from parsed resume
- Draft partial updates
- Draft retrieval
- Publishing workflow
- Validation errors
- Cross-user access prevention
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models_user import User
from app.db.models_portfolio import PortfolioDraft, PortfolioSite
from app.features.portfolios.service_draft import PortfolioDraftService
from app.features.portfolios.service_publish import PortfolioPublishService
from app.core.security import hash_password


@pytest.mark.asyncio
async def test_seed_draft_from_parsed_resume(db: AsyncSession):
    """Test creating draft from parsed resume JSON."""
    # Create a test user
    user = User(
        email="drafttest@example.com",
        password_hash=hash_password("SecurePass123!"),
        full_name="Draft Test",
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Sample parsed resume data (matching the expected structure from parser)
    parsed_resume = {
        "data": {
            "extractedData": {
                "parsed": {
                    "name": "John Doe",
                    "email": "john@example.com",
                    "about": "Experienced developer",
                    "skills": ["Python", "JavaScript"],
                    "experience": [{"role": "Developer", "company": "Tech Co"}],
                    "education": [{"degree": "B.Sc.", "institution": "University"}],
                }
            }
        }
    }
    
    # Seed draft
    draft = await PortfolioDraftService.seed_from_parsed(
        db, user_id=user.id, parsed_resume=parsed_resume, resume_source_id=1
    )
    
    assert draft is not None
    assert draft.user_id == user.id
    assert draft.is_active is True
    assert draft.version == 1
    assert draft.resume_source_id == 1
    # about is stored as dict with "text" key
    assert draft.about is not None
    assert draft.about.get("text") == "Experienced developer"


@pytest.mark.asyncio
async def test_get_active_draft(db: AsyncSession):
    """Test retrieving active draft for user."""
    # Create a test user
    user = User(
        email="getdrafttest@example.com",
        password_hash=hash_password("SecurePass123!"),
        full_name="Get Draft Test",
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Create a draft
    parsed_resume = {"name": "Test User", "about": "Test about"}
    draft = await PortfolioDraftService.seed_from_parsed(
        db, user_id=user.id, parsed_resume=parsed_resume
    )
    
    # Retrieve active draft
    retrieved = await PortfolioDraftService.get_active_draft(db, user_id=user.id)
    
    assert retrieved is not None
    assert retrieved.id == draft.id
    assert retrieved.is_active is True


@pytest.mark.asyncio
async def test_get_active_draft_nonexistent(db: AsyncSession):
    """Test retrieving active draft when none exists."""
    # Create a test user
    user = User(
        email="nodrafttest@example.com",
        password_hash=hash_password("SecurePass123!"),
        full_name="No Draft Test",
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Try to retrieve draft
    retrieved = await PortfolioDraftService.get_active_draft(db, user_id=user.id)
    
    assert retrieved is None


@pytest.mark.asyncio
async def test_update_draft_partial(db: AsyncSession):
    """Test partial update of draft with deep merge."""
    # Create a test user
    user = User(
        email="updatedrafttest@example.com",
        password_hash=hash_password("SecurePass123!"),
        full_name="Update Draft Test",
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Create initial draft
    parsed_resume = {
        "name": "Test User",
        "about": "Original about",
        "skills": ["Python"],
    }
    draft = await PortfolioDraftService.seed_from_parsed(
        db, user_id=user.id, parsed_resume=parsed_resume
    )
    
    # Partial update
    patch = {"about": "Updated about"}
    updated = await PortfolioDraftService.update_partial(
        db, user_id=user.id, patch=patch
    )
    
    assert updated.about == "Updated about"
    assert updated.version == 2  # Version should be bumped
    # Other fields should remain unchanged
    assert updated.user_id == user.id


@pytest.mark.asyncio
async def test_publish_draft_success(db: AsyncSession):
    """Test successful draft publishing."""
    # Create a test user
    user = User(
        email="publishtest@example.com",
        password_hash=hash_password("SecurePass123!"),
        full_name="Publish Test",
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Create a complete draft with all required fields (using correct nested structure)
    parsed_resume = {
        "data": {
            "extractedData": {
                "parsed": {
                    "name": "Test User",
                    "email": "test@example.com",
                    "about": "Test about",
                    "skills": ["Python", "JavaScript"],
                    "experience": [{"role": "Developer", "company": "Tech Co"}],
                }
            }
        }
    }
    draft = await PortfolioDraftService.seed_from_parsed(
        db, user_id=user.id, parsed_resume=parsed_resume
    )
    
    # Publish draft
    published = await PortfolioPublishService.publish_draft(
        db, user_id=user.id, custom_slug="test-user"
    )
    
    assert published is not None
    assert published.slug == "test-user"
    assert published.user_id == user.id
    assert published.status == "published"


@pytest.mark.asyncio
async def test_publish_draft_no_draft(db: AsyncSession):
    """Test publishing when no draft exists raises error."""
    # Create a test user
    user = User(
        email="nopublishtest@example.com",
        password_hash=hash_password("SecurePass123!"),
        full_name="No Publish Test",
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Try to publish without draft
    with pytest.raises(ValueError, match="No active draft"):
        await PortfolioPublishService.publish_draft(db, user_id=user.id)


@pytest.mark.asyncio
async def test_get_public_portfolio(db: AsyncSession):
    """Test retrieving published portfolio by slug."""
    # Create a test user
    user = User(
        email="getpublictest@example.com",
        password_hash=hash_password("SecurePass123!"),
        full_name="Get Public Test",
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Create and publish draft (using correct nested structure)
    parsed_resume = {
        "data": {
            "extractedData": {
                "parsed": {
                    "name": "Test User",
                    "email": "test@example.com",
                    "about": "Test about",
                    "skills": ["Python"],
                    "experience": [{"role": "Developer", "company": "Tech Co"}],
                }
            }
        }
    }
    draft = await PortfolioDraftService.seed_from_parsed(
        db, user_id=user.id, parsed_resume=parsed_resume
    )
    
    published = await PortfolioPublishService.publish_draft(
        db, user_id=user.id, custom_slug="test-user"
    )
    
    # Retrieve published portfolio
    retrieved = await PortfolioPublishService.get_public_portfolio(
        db, slug="test-user"
    )
    
    assert retrieved is not None
    assert retrieved.slug == "test-user"
    assert retrieved.status == "published"


@pytest.mark.asyncio
async def test_get_public_portfolio_not_found(db: AsyncSession):
    """Test retrieving non-existent published portfolio."""
    # Try to retrieve non-existent portfolio
    with pytest.raises(ValueError, match="not found"):
        await PortfolioPublishService.get_public_portfolio(db, slug="nonexistent-slug")


@pytest.mark.asyncio
async def test_draft_cross_user_isolation(db: AsyncSession):
    """Test that users cannot access each other's drafts."""
    # Create two users
    user1 = User(
        email="user1@example.com",
        password_hash=hash_password("SecurePass123!"),
        full_name="User 1",
        is_active=True,
    )
    user2 = User(
        email="user2@example.com",
        password_hash=hash_password("SecurePass123!"),
        full_name="User 2",
        is_active=True,
    )
    db.add(user1)
    db.add(user2)
    await db.commit()
    await db.refresh(user1)
    await db.refresh(user2)
    
    # Create draft for user1
    parsed_resume = {"name": "User 1", "about": "User 1 about"}
    await PortfolioDraftService.seed_from_parsed(
        db, user_id=user1.id, parsed_resume=parsed_resume
    )
    
    # User2 should not see user1's draft
    user2_draft = await PortfolioDraftService.get_active_draft(db, user_id=user2.id)
    assert user2_draft is None
    
    # User1 should see their own draft
    user1_draft = await PortfolioDraftService.get_active_draft(db, user_id=user1.id)
    assert user1_draft is not None
    assert user1_draft.user_id == user1.id

