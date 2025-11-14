"""
Authentication service layer - Business logic for user management and authentication.

This module handles:
- User registration and authentication
- Token creation, refresh, and revocation
- Profile management
"""

from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.db.models_user import User
from app.db.models_refresh_token import RefreshToken
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    generate_refresh_token,
    hash_refresh_token,
)
from app.core.config import REFRESH_TOKEN_EXPIRE_DAYS
from app.features.auth.schemas import RegisterRequest, UpdateProfile


# ============================================================================
# User Queries
# ============================================================================

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """Find a user by email address."""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    """Find a user by ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


# ============================================================================
# User Registration
# ============================================================================

async def register_user(db: AsyncSession, data: RegisterRequest) -> User:
    """
    Register a new user.
    
    Args:
        db: Database session
        data: Registration data (email, password, profile info)
    
    Returns:
        Created User object
    
    Raises:
        ValueError: If email already exists
    """
    # Check if email already exists
    existing_user = await get_user_by_email(db, data.email)
    if existing_user:
        raise ValueError("Email already registered")
    
    # Create new user with only email and password
    user = User(
        email=data.email,
        password_hash=hash_password(data.password.get_secret_value()),
        full_name=None,
        headline=None,
        location=None,
        timezone=None,
        languages=None,
        phone_e164=None,
        is_active=True,
        is_verified=False,
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return user


# ============================================================================
# Authentication
# ============================================================================

async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    """
    Authenticate a user with email and password.
    
    Args:
        db: Database session
        email: User email
        password: Plain text password
    
    Returns:
        User object if credentials are valid, None otherwise
    """
    user = await get_user_by_email(db, email)
    if not user:
        return None
    
    if not verify_password(password, user.password_hash):
        return None
    
    if not user.is_active:
        return None
    
    return user


# ============================================================================
# Token Management
# ============================================================================

async def create_tokens_for_user(
    db: AsyncSession,
    user: User,
    user_agent: str | None = None,
    ip_address: str | None = None
) -> tuple[str, str]:
    """
    Create access and refresh tokens for a user.
    
    Args:
        db: Database session
        user: User object
        user_agent: User agent string from request
        ip_address: IP address from request
    
    Returns:
        Tuple of (access_token, refresh_token)
    """
    # Create access token (JWT)
    access_token = create_access_token(user.id, user.email)
    
    # Create refresh token (opaque)
    refresh_token = generate_refresh_token()
    token_hash = hash_refresh_token(refresh_token)
    
    # Store refresh token in database
    expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    db_token = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
        user_agent=user_agent,
        ip_address=ip_address,
    )
    
    db.add(db_token)
    await db.commit()
    
    return access_token, refresh_token


async def refresh_access_token(
    db: AsyncSession,
    refresh_token: str,
    user_agent: str | None = None,
    ip_address: str | None = None
) -> tuple[str, str] | None:
    """
    Refresh an access token using a refresh token.
    
    Implements token rotation: old refresh token is revoked and a new one is issued.
    
    Args:
        db: Database session
        refresh_token: Current refresh token
        user_agent: User agent string from request
        ip_address: IP address from request
    
    Returns:
        Tuple of (new_access_token, new_refresh_token) or None if invalid
    """
    token_hash = hash_refresh_token(refresh_token)
    
    # Find the refresh token
    result = await db.execute(
        select(RefreshToken)
        .where(RefreshToken.token_hash == token_hash)
        .where(RefreshToken.revoked_at.is_(None))
    )
    db_token = result.scalar_one_or_none()
    
    if not db_token:
        return None
    
    # Check if token is expired
    if db_token.expires_at < datetime.utcnow():
        return None
    
    # Get the user
    user = await get_user_by_id(db, db_token.user_id)
    if not user or not user.is_active:
        return None
    
    # Revoke old token
    db_token.revoked_at = datetime.utcnow()
    
    # Create new tokens
    new_access_token = create_access_token(user.id, user.email)
    new_refresh_token = generate_refresh_token()
    new_token_hash = hash_refresh_token(new_refresh_token)
    
    # Store new refresh token with rotation tracking
    expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    new_db_token = RefreshToken(
        user_id=user.id,
        token_hash=new_token_hash,
        expires_at=expires_at,
        user_agent=user_agent,
        ip_address=ip_address,
        rotation_parent_id=db_token.id,
    )
    
    db.add(new_db_token)
    await db.commit()
    
    return new_access_token, new_refresh_token


async def revoke_refresh_token(db: AsyncSession, refresh_token: str) -> bool:
    """
    Revoke a single refresh token (logout from one device).
    
    Args:
        db: Database session
        refresh_token: Refresh token to revoke
    
    Returns:
        True if token was revoked, False if not found
    """
    token_hash = hash_refresh_token(refresh_token)
    
    result = await db.execute(
        update(RefreshToken)
        .where(RefreshToken.token_hash == token_hash)
        .where(RefreshToken.revoked_at.is_(None))
        .values(revoked_at=datetime.utcnow())
    )
    await db.commit()
    
    return result.rowcount > 0


async def revoke_all_user_tokens(db: AsyncSession, user_id: int) -> int:
    """
    Revoke all refresh tokens for a user (logout from all devices).
    
    Args:
        db: Database session
        user_id: User ID
    
    Returns:
        Number of tokens revoked
    """
    result = await db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user_id)
        .where(RefreshToken.revoked_at.is_(None))
        .values(revoked_at=datetime.utcnow())
    )
    await db.commit()
    
    return result.rowcount


# ============================================================================
# Profile Management
# ============================================================================

async def update_user_profile(
    db: AsyncSession,
    user_id: int,
    data: UpdateProfile
) -> User | None:
    """
    Update user profile information.
    
    Args:
        db: Database session
        user_id: User ID
        data: Profile update data
    
    Returns:
        Updated User object or None if user not found
    """
    user = await get_user_by_id(db, user_id)
    if not user:
        return None
    
    # Update only provided fields
    update_data = data.model_dump(exclude_unset=True)
    
    # Handle languages field (convert list to JSONB format)
    if "languages" in update_data and update_data["languages"] is not None:
        update_data["languages"] = {"languages": update_data["languages"]}
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    await db.commit()
    await db.refresh(user)
    
    return user
