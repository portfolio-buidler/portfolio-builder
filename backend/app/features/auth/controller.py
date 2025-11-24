"""
Authentication controller - HTTP request handlers for auth endpoints.

This module handles:
- Request/response processing
- Cookie management
- Error handling
- Calling service layer functions
"""

from fastapi import Response, Request, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import (
    get_current_user,
    create_refresh_token_cookie,
    clear_refresh_token_cookie,
    hash_password,
    verify_password,
)
from app.core.errors import AuthenticationError, ConflictError
from app.core.config import ACCESS_TOKEN_EXPIRE_MINUTES
from app.db.models_user import User
from app.features.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    TokenPair,
    UserPublic,
    UpdateProfile,
    ChangePasswordRequest,
)
from app.features.auth import service


# ============================================================================
# Registration
# ============================================================================

async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db)
) -> UserPublic:
    """
    Register a new user.
    
    Args:
        data: Registration data (email, password, profile)
        db: Database session
    
    Returns:
        UserPublic: Created user profile
    
    Raises:
        HTTPException 409: If email already exists
        HTTPException 422: If validation fails
    """
    try:
        user = await service.register_user(db, data)
        return UserPublic.model_validate(user)
    except ValueError as e:
        # Check if it's a duplicate email error
        if "already registered" in str(e).lower():
            raise ConflictError(str(e))
        # Otherwise, it's a validation error
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )


# ============================================================================
# Login
# ============================================================================

async def login(
    data: LoginRequest,
    response: Response,
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> TokenPair:
    """
    Authenticate user and return tokens.
    
    Args:
        data: Login credentials (email, password)
        response: FastAPI response object (for setting cookies)
        request: FastAPI request object (for user agent, IP)
        db: Database session
    
    Returns:
        TokenPair: Access and refresh tokens
    
    Raises:
        HTTPException 401: If credentials are invalid
    """
    # Authenticate user
    user = await service.authenticate_user(
        db,
        data.email,
        data.password.get_secret_value()
    )
    
    if not user:
        raise AuthenticationError("Invalid email or password")
    
    # Get request metadata
    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None
    
    # Create tokens
    access_token, refresh_token = await service.create_tokens_for_user(
        db, user, user_agent, ip_address
    )
    
    # Set refresh token in HttpOnly cookie
    cookie_params = create_refresh_token_cookie(refresh_token)
    response.set_cookie(**cookie_params)
    
    return TokenPair(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


# ============================================================================
# Token Refresh
# ============================================================================

async def refresh(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
) -> TokenPair:
    """
    Refresh access token using refresh token from cookie.
    
    Implements token rotation: old refresh token is revoked, new one issued.
    
    Args:
        request: FastAPI request object (for reading cookie)
        response: FastAPI response object (for setting new cookie)
        db: Database session
    
    Returns:
        TokenPair: New access and refresh tokens
    
    Raises:
        HTTPException 401: If refresh token is invalid or expired
    """
    # Get refresh token from cookie
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise AuthenticationError("Refresh token not found")
    
    # Get request metadata
    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None
    
    # Refresh tokens
    result = await service.refresh_access_token(
        db, refresh_token, user_agent, ip_address
    )
    
    if not result:
        raise AuthenticationError("Invalid or expired refresh token")
    
    new_access_token, new_refresh_token = result
    
    # Set new refresh token in cookie
    cookie_params = create_refresh_token_cookie(new_refresh_token)
    response.set_cookie(**cookie_params)
    
    return TokenPair(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


# ============================================================================
# Logout
# ============================================================================

async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Logout user by revoking refresh token.
    
    Args:
        request: FastAPI request object (for reading cookie)
        response: FastAPI response object (for clearing cookie)
        db: Database session
    
    Returns:
        Success message
    """
    # Get refresh token from cookie
    refresh_token = request.cookies.get("refresh_token")
    
    if refresh_token:
        # Revoke the token
        await service.revoke_refresh_token(db, refresh_token)
    
    # Clear refresh token cookie
    cookie_params = clear_refresh_token_cookie()
    response.set_cookie(**cookie_params)
    
    return {"message": "Logged out successfully"}


# ============================================================================
# Get Current User Profile
# ============================================================================

async def get_me(
    user: User = Depends(get_current_user)
) -> UserPublic:
    """
    Get current authenticated user's profile.
    
    Args:
        user: Current user from auth dependency
    
    Returns:
        UserPublic: User profile
    """
    return UserPublic.model_validate(user)


# ============================================================================
# Update Profile
# ============================================================================

async def update_me(
    data: UpdateProfile,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> UserPublic:
    """
    Update current user's profile.
    
    Args:
        data: Profile update data
        user: Current user from auth dependency
        db: Database session
    
    Returns:
        UserPublic: Updated user profile
    
    Raises:
        HTTPException 404: If user not found (shouldn't happen)
    """
    updated_user = await service.update_user_profile(db, user.id, data)
    
    if not updated_user:
        raise AuthenticationError("User not found")
    
    return UserPublic.model_validate(updated_user)


# ============================================================================
# Change Password
# ============================================================================

async def change_password(
    data: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Change user's password.
    
    Args:
        data: Password change data (old, new, revoke_all_sessions)
        user: Current user from auth dependency
        db: Database session
    
    Returns:
        Success message with session revocation count
    
    Raises:
        HTTPException 401: If old password is incorrect
    """
    # Verify old password
    if not verify_password(data.old_password.get_secret_value(), user.password_hash):
        raise AuthenticationError("Incorrect password")
    
    # Update password
    user.password_hash = hash_password(data.new_password.get_secret_value())
    await db.commit()
    
    # Optionally revoke all sessions
    revoked_count = 0
    if data.revoke_all_sessions:
        revoked_count = await service.revoke_all_user_tokens(db, user.id)
    
    return {
        "message": "Password changed successfully",
        "sessions_revoked": revoked_count
    }
