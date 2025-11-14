"""
Authentication routes - FastAPI router configuration.

Endpoints:
- POST   /auth/register       - Register new user
- POST   /auth/login          - Login and get tokens
- POST   /auth/refresh        - Refresh access token
- POST   /auth/logout         - Logout (revoke token)
- GET    /auth/me             - Get current user profile
- PATCH  /auth/me             - Update current user profile
- POST   /auth/change-password - Change password
"""

from fastapi import APIRouter, Request, Response, Depends
from app.core.db import get_db
from app.core.security import get_current_user
from app.features.auth import controller
from app.features.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    TokenPair,
    UserPublic,
    UpdateProfile,
    ChangePasswordRequest,
)

# Create router with /auth prefix
router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# ============================================================================
# Public Endpoints (No Authentication Required)
# ============================================================================

@router.post(
    "/register",
    response_model=UserPublic,
    status_code=201,
    summary="Register a new user",
    description="Create a new user account with email and password"
)
async def register_endpoint(
    data: RegisterRequest,
    db=Depends(get_db)
):
    """Register a new user account."""
    return await controller.register(data, db)


@router.post(
    "/login",
    response_model=TokenPair,
    summary="Login",
    description="Authenticate with email and password, returns access token and sets refresh token cookie"
)
async def login_endpoint(
    data: LoginRequest,
    response: Response,
    request: Request,
    db=Depends(get_db)
):
    """Login and receive authentication tokens."""
    return await controller.login(data, response, request, db)


@router.post(
    "/refresh",
    response_model=TokenPair,
    summary="Refresh access token",
    description="Use refresh token from cookie to get a new access token (token rotation)"
)
async def refresh_endpoint(
    request: Request,
    response: Response,
    db=Depends(get_db)
):
    """Refresh access token using refresh token from cookie."""
    return await controller.refresh(request, response, db)


@router.post(
    "/logout",
    summary="Logout",
    description="Revoke refresh token and clear cookie"
)
async def logout_endpoint(
    request: Request,
    response: Response,
    db=Depends(get_db)
):
    """Logout and revoke refresh token."""
    return await controller.logout(request, response, db)


# ============================================================================
# Protected Endpoints (Authentication Required)
# ============================================================================

@router.get(
    "/me",
    response_model=UserPublic,
    summary="Get current user",
    description="Get the profile of the currently authenticated user"
)
async def get_me_endpoint(
    user=Depends(get_current_user)
):
    """Get current user's profile."""
    return await controller.get_me(user)


@router.patch(
    "/me",
    response_model=UserPublic,
    summary="Update profile",
    description="Update the current user's profile information"
)
async def update_me_endpoint(
    data: UpdateProfile,
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    """Update current user's profile."""
    return await controller.update_me(data, user, db)


@router.post(
    "/change-password",
    summary="Change password",
    description="Change the current user's password with optional session revocation"
)
async def change_password_endpoint(
    data: ChangePasswordRequest,
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    """Change user's password."""
    return await controller.change_password(data, user, db)
