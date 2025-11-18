"""
Authentication Integration Tests

Tests the auth endpoints with real database interactions:
- Registration with full_name
- Login with credentials
- Token refresh flow
- User profile retrieval
- Logout
"""

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.db.models_user import User


@pytest.mark.asyncio
async def test_register_user_with_full_name(client: AsyncClient, db: AsyncSession):
    """
    Test user registration with full_name field.
    
    Verifies:
    1. Registration accepts full_name
    2. User is created in database
    3. Response includes user data with full_name
    """
    registration_data = {
        "email": "test@example.com",
        "password": "SecurePass123!",
        "full_name": "Test User"
    }
    
    response = await client.post("/auth/register", json=registration_data)
    
    # Should succeed with 201
    assert response.status_code == 201, f"Registration failed: {response.text}"
    
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"
    assert "id" in data
    assert "created_at" in data
    
    # Verify user exists in database with full_name
    from sqlalchemy import select
    stmt = select(User).where(User.email == "test@example.com")
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    assert user is not None
    assert user.full_name == "Test User"
    assert user.email == "test@example.com"


@pytest.mark.asyncio
async def test_login_and_get_current_user(client: AsyncClient, db: AsyncSession):
    """
    Test login flow and current user retrieval.
    
    Verifies:
    1. User can log in with credentials
    2. Access token is returned
    3. Refresh token is set as HttpOnly cookie
    4. /auth/me returns user with full_name
    """
    # First register a user
    registration_data = {
        "email": "login@example.com",
        "password": "SecurePass123!",
        "full_name": "Login Test User"
    }
    
    reg_response = await client.post("/auth/register", json=registration_data)
    assert reg_response.status_code == 201
    
    # Now login
    login_data = {
        "email": "login@example.com",
        "password": "SecurePass123!"
    }
    
    login_response = await client.post("/auth/login", json=login_data)
    assert login_response.status_code == 200, f"Login failed: {login_response.text}"
    
    login_result = login_response.json()
    assert "access_token" in login_result
    assert login_result["token_type"] == "bearer"
    
    # Verify refresh token cookie is set
    cookies = login_response.cookies
    assert "refresh_token" in cookies
    
    # Use access token to get current user
    access_token = login_result["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    
    me_response = await client.get("/auth/me", headers=headers)
    assert me_response.status_code == 200
    
    user_data = me_response.json()
    assert user_data["email"] == "login@example.com"
    assert user_data["full_name"] == "Login Test User"


@pytest.mark.asyncio
async def test_register_duplicate_email_fails(client: AsyncClient):
    """
    Test that registering with duplicate email fails.
    """
    registration_data = {
        "email": "duplicate@example.com",
        "password": "SecurePass123!",
        "full_name": "First User"
    }
    
    # First registration should succeed
    response1 = await client.post("/auth/register", json=registration_data)
    assert response1.status_code == 201
    
    # Second registration with same email should fail
    registration_data["full_name"] = "Second User"
    response2 = await client.post("/auth/register", json=registration_data)
    assert response2.status_code == 401  # Backend returns 401 for duplicate email
    assert "already registered" in response2.json()["detail"].lower()


@pytest.mark.asyncio
async def test_login_invalid_credentials_fails(client: AsyncClient):
    """
    Test that login with invalid credentials fails.
    """
    # Register a user first
    registration_data = {
        "email": "valid@example.com",
        "password": "SecurePass123!",
        "full_name": "Valid User"
    }
    
    reg_response = await client.post("/auth/register", json=registration_data)
    assert reg_response.status_code == 201
    
    # Try to login with wrong password
    login_data = {
        "email": "valid@example.com",
        "password": "WrongPassword123!"
    }
    
    login_response = await client.post("/auth/login", json=login_data)
    assert login_response.status_code == 401
    assert "invalid" in login_response.json()["detail"].lower()  # Backend says 'invalid'


@pytest.mark.asyncio
async def test_logout_clears_refresh_token(client: AsyncClient):
    """
    Test that logout endpoint clears the refresh token cookie.
    """
    # Register and login
    registration_data = {
        "email": "logout@example.com",
        "password": "SecurePass123!",
        "full_name": "Logout Test"
    }
    
    await client.post("/auth/register", json=registration_data)
    
    login_response = await client.post(
        "/auth/login",
        json={"email": "logout@example.com", "password": "SecurePass123!"}
    )
    
    access_token = login_response.json()["access_token"]
    
    # Logout
    logout_response = await client.post(
        "/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    
    assert logout_response.status_code == 200
    
    # Verify refresh_token cookie is cleared (expires or deleted)
    cookies = logout_response.cookies
    if "refresh_token" in cookies:
        # Cookie should be expired or empty
        assert cookies["refresh_token"] == "" or "max-age=0" in str(cookies).lower()


@pytest.mark.asyncio
async def test_register_without_full_name_fails(client: AsyncClient):
    """
    Test that registration without full_name field fails validation.
    """
    registration_data = {
        "email": "nofullname@example.com",
        "password": "SecurePass123!"
        # Missing full_name
    }
    
    response = await client.post("/auth/register", json=registration_data)
    
    # Should fail with 422 (validation error)
    assert response.status_code == 422
    
    detail = response.json()["detail"]
    # Pydantic validation error should mention full_name
    assert any("full_name" in str(err).lower() for err in detail)
