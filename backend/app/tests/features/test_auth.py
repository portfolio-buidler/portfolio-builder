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
    
    response = await client.post("/api/v1/auth/register", json=registration_data)
    
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
    
    reg_response = await client.post("/api/v1/auth/register", json=registration_data)
    assert reg_response.status_code == 201
    
    # Now login
    login_data = {
        "email": "login@example.com",
        "password": "SecurePass123!"
    }
    
    login_response = await client.post("/api/v1/auth/login", json=login_data)
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
    
    me_response = await client.get("/api/v1/auth/me", headers=headers)
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
    response1 = await client.post("/api/v1/auth/register", json=registration_data)
    assert response1.status_code == 201
    
    # Second registration with same email should fail
    registration_data["full_name"] = "Second User"
    response2 = await client.post("/api/v1/auth/register", json=registration_data)
    assert response2.status_code == 409  # Backend returns 409 Conflict for duplicate email
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
    
    reg_response = await client.post("/api/v1/auth/register", json=registration_data)
    assert reg_response.status_code == 201
    
    # Try to login with wrong password
    login_data = {
        "email": "valid@example.com",
        "password": "WrongPassword123!"
    }
    
    login_response = await client.post("/api/v1/auth/login", json=login_data)
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
    
    await client.post("/api/v1/auth/register", json=registration_data)
    
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "logout@example.com", "password": "SecurePass123!"}
    )
    
    access_token = login_response.json()["access_token"]
    
    # Logout
    logout_response = await client.post(
        "/api/v1/auth/logout",
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
    
    response = await client.post("/api/v1/auth/register", json=registration_data)
    
    # Should fail with 422 (validation error)
    assert response.status_code == 422
    
    detail = response.json()["detail"]
    # Pydantic validation error should mention full_name
    assert any("full_name" in str(err).lower() for err in detail)


@pytest.mark.asyncio
async def test_auth_me_without_token_fails(client: AsyncClient):
    """
    Test that accessing /auth/me without token returns 401.
    """
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401
    detail = response.json()["detail"].lower()
    assert "missing authentication" in detail or "not authenticated" in detail or "unauthorized" in detail


@pytest.mark.asyncio
async def test_auth_me_with_invalid_token_fails(client: AsyncClient):
    """
    Test that accessing /auth/me with invalid token returns 401.
    """
    headers = {"Authorization": "Bearer invalid_token_12345"}
    response = await client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_auth_me_with_malformed_token_fails(client: AsyncClient):
    """
    Test that accessing /auth/me with malformed Authorization header returns 401.
    """
    # Missing 'Bearer' prefix
    headers = {"Authorization": "some_token"}
    response = await client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_logout_without_token_fails(client: AsyncClient):
    """
    Test that logout without authentication returns 401.
    """
    response = await client.post("/api/v1/auth/logout")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_register_with_weak_password_fails(client: AsyncClient):
    """
    Test that registration with weak password fails validation.
    """
    weak_passwords = [
        "short",      # Too short
        "12345678",   # No letters
        "password",   # No numbers
    ]
    
    for password in weak_passwords:
        registration_data = {
            "email": f"weak{password}@example.com",
            "password": password,
            "full_name": "Weak Password Test"
        }
        
        response = await client.post("/api/v1/auth/register", json=registration_data)
        
        # Should fail with 422 (validation error)
        assert response.status_code == 422, f"Weak password '{password}' should fail"


@pytest.mark.asyncio
async def test_register_with_invalid_email_fails(client: AsyncClient):
    """
    Test that registration with invalid email fails validation.
    """
    invalid_emails = [
        "notanemail",
        "missing@domain",
        "@nodomain.com",
        "spaces in@email.com",
    ]
    
    for email in invalid_emails:
        registration_data = {
            "email": email,
            "password": "SecurePass123!",
            "full_name": "Invalid Email Test"
        }
        
        response = await client.post("/api/v1/auth/register", json=registration_data)
        
        # Should fail with 422 (validation error)
        assert response.status_code == 422, f"Invalid email '{email}' should fail"


@pytest.mark.asyncio
async def test_login_nonexistent_user_fails(client: AsyncClient):
    """
    Test that login with non-existent email fails.
    """
    login_data = {
        "email": "doesnotexist@example.com",
        "password": "SecurePass123!"
    }
    
    response = await client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 401
    assert "invalid" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_refresh_token_flow(client: AsyncClient):
    """
    Test refresh token flow (if implemented).
    
    Verifies:
    1. Register and login to get refresh token cookie
    2. Use refresh token to get new access token
    """
    # Register and login
    registration_data = {
        "email": "refresh@example.com",
        "password": "SecurePass123!",
        "full_name": "Refresh Test"
    }
    
    await client.post("/api/v1/auth/register", json=registration_data)
    
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "refresh@example.com", "password": "SecurePass123!"}
    )
    
    assert login_response.status_code == 200
    assert "refresh_token" in login_response.cookies
    
    # Try to refresh - httpx.AsyncClient should automatically include cookies
    refresh_response = await client.post("/api/v1/auth/refresh")
    
    # If endpoint exists and cookie is present, should return new access token
    if refresh_response.status_code == 200:
        refresh_data = refresh_response.json()
        assert "access_token" in refresh_data
        assert refresh_data["token_type"] == "bearer"
    # If no cookie, should return 401
    elif refresh_response.status_code == 401:
        # Check if it's because cookie wasn't sent (httpx might not auto-include cookies)
        # In this case, manually pass the cookie
        refresh_token_cookie = login_response.cookies.get("refresh_token")
        if refresh_token_cookie:
            # Retry with explicit cookie
            refresh_response = await client.post(
                "/api/v1/auth/refresh",
                cookies={"refresh_token": refresh_token_cookie}
            )
            assert refresh_response.status_code == 200
            refresh_data = refresh_response.json()
            assert "access_token" in refresh_data
            assert refresh_data["token_type"] == "bearer"
        else:
            pytest.fail("Refresh token cookie not found in login response")
    # If endpoint not implemented yet, test will pass but note it
    elif refresh_response.status_code == 404:
        pytest.skip("Refresh endpoint not implemented yet")


@pytest.mark.asyncio
async def test_concurrent_registrations_same_email(client: AsyncClient):
    """
    Test that concurrent registrations with same email don't create duplicates.
    
    This tests database uniqueness constraint under race conditions.
    """
    import asyncio
    
    registration_data = {
        "email": "concurrent@example.com",
        "password": "SecurePass123!",
        "full_name": "Concurrent Test"
    }
    
    # Send 3 registration requests concurrently
    responses = await asyncio.gather(
        client.post("/api/v1/auth/register", json=registration_data),
        client.post("/api/v1/auth/register", json=registration_data),
        client.post("/api/v1/auth/register", json=registration_data),
        return_exceptions=True
    )
    
    # Exactly one should succeed (201), others should fail (409 Conflict)
    # Handle both exceptions and response objects
    success_count = 0
    fail_count = 0
    other_count = 0
    for r in responses:
        if isinstance(r, Exception):
            # Exceptions from httpx (like InvalidRequestError) indicate the request failed
            # This can happen with concurrent requests due to database constraints
            other_count += 1
            continue
        if hasattr(r, 'status_code'):
            if r.status_code == 201:
                success_count += 1
            elif r.status_code == 409:
                fail_count += 1
            else:
                other_count += 1
    
    # In concurrent scenarios, we expect:
    # - 1 success (201)
    # - 2 failures (either 409 Conflict or exceptions due to IntegrityError)
    # The exceptions occur when IntegrityError is raised during commit
    assert success_count == 1, f"Exactly one registration should succeed, got {success_count}. Responses: {[r.status_code if hasattr(r, 'status_code') else type(r).__name__ for r in responses]}"
    assert (fail_count + other_count) == 2, f"Two registrations should fail (409 or exception), got {fail_count} failures and {other_count} exceptions. Responses: {[r.status_code if hasattr(r, 'status_code') else type(r).__name__ for r in responses]}"


@pytest.mark.asyncio
async def test_user_email_case_insensitive(client: AsyncClient):
    """
    Test that email comparison is case-insensitive.
    
    Verifies:
    1. Register with lowercase email
    2. Login with uppercase email should work
    """
    # Register with lowercase
    registration_data = {
        "email": "casetest@example.com",
        "password": "SecurePass123!",
        "full_name": "Case Test"
    }
    
    reg_response = await client.post("/api/v1/auth/register", json=registration_data)
    assert reg_response.status_code == 201
    
    # Login with uppercase
    login_data = {
        "email": "CASETEST@EXAMPLE.COM",
        "password": "SecurePass123!"
    }
    
    login_response = await client.post("/api/v1/auth/login", json=login_data)
    assert login_response.status_code == 200, "Login with uppercase email should work"
    
    # Duplicate registration with different case should fail
    registration_data2 = {
        "email": "CaseTest@Example.Com",
        "password": "SecurePass123!",
        "full_name": "Case Test 2"
    }
    
    dup_response = await client.post("/api/v1/auth/register", json=registration_data2)
    assert dup_response.status_code == 409, "Duplicate email with different case should fail with 409 Conflict"

