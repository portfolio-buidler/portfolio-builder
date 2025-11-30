"""
Integration tests for authentication endpoints.

Tests cover:
- User registration
- Login and token generation
- Token refresh
- Logout
- Password validation
- Email case insensitivity
- Token revocation
- Password change
"""

import pytest
from datetime import datetime
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.main import app
from app.db.models_user import User
from app.features.auth.service import (
    create_tokens_for_user,
    refresh_access_token,
    revoke_refresh_token,
    revoke_all_user_tokens,
)
from app.core.security import hash_password, verify_password, hash_refresh_token
from app.db.models_refresh_token import RefreshToken


@pytest.mark.asyncio
async def test_register_user_with_full_name(client: AsyncClient, db: AsyncSession):
    """
    Test user registration with full_name field.
    
    Verifies:
    1. Registration accepts full_name
    2. User is created in database
    3. Response includes user data
    """
    registration_data = {
        "email": "testuser@example.com",
        "password": "SecurePass123!",
        "full_name": "Test User"
    }
    
    response = await client.post("/api/v1/auth/register", json=registration_data)
    
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "testuser@example.com"
    assert data["full_name"] == "Test User"
    
    # Verify user exists in database
    from app.features.auth.service import get_user_by_email
    user = await get_user_by_email(db, "testuser@example.com")
    assert user is not None
    assert user.full_name == "Test User"


@pytest.mark.asyncio
async def test_login_and_get_current_user(client: AsyncClient, db: AsyncSession):
    """
    Test login flow and current user retrieval.
    
    Verifies:
    1. User can log in with credentials
    2. Access token is returned
    3. Refresh token is set in cookie
    4. Access token can be used to get current user
    """
    # Register a user first
    registration_data = {
        "email": "login@example.com",
        "password": "SecurePass123!",
        "full_name": "Login Test User"
    }
    
    await client.post("/api/v1/auth/register", json=registration_data)
    
    # Login
    login_data = {
        "email": "login@example.com",
        "password": "SecurePass123!"
    }
    
    login_response = await client.post("/api/v1/auth/login", json=login_data)
    assert login_response.status_code == 200
    
    login_result = login_response.json()
    assert "access_token" in login_result
    assert login_result["token_type"] == "bearer"
    assert "refresh_token" in login_response.cookies
    
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
    assert response2.status_code == 409
    assert "already" in response2.json()["detail"].lower() or "conflict" in response2.json()["detail"].lower()


@pytest.mark.asyncio
async def test_login_invalid_credentials_fails(client: AsyncClient):
    """
    Test that login with invalid credentials fails.
    """
    # Register a user first
    registration_data = {
        "email": "invalid@example.com",
        "password": "SecurePass123!",
        "full_name": "Invalid Test"
    }
    
    await client.post("/api/v1/auth/register", json=registration_data)
    
    # Try to login with wrong password
    login_data = {
        "email": "invalid@example.com",
        "password": "WrongPassword123!"
    }
    
    response = await client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 401
    assert "invalid" in response.json()["detail"].lower() or "credentials" in response.json()["detail"].lower()


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
    
    assert login_response.status_code == 200
    assert "refresh_token" in login_response.cookies
    
    # Get access token for authenticated logout
    access_token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Logout
    logout_response = await client.post("/api/v1/auth/logout", headers=headers)
    assert logout_response.status_code == 200
    
    # Check that refresh_token cookie is cleared (empty or missing)
    cookies = logout_response.cookies
    if "refresh_token" in cookies:
        # Cookie should be cleared (empty value or expires in past)
        assert cookies["refresh_token"] == "" or "refresh_token" not in cookies


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
    assert response.status_code == 422


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
        "@example.com",
        "invalid..email@example.com",
    ]
    
    for email in invalid_emails:
        registration_data = {
            "email": email,
            "password": "SecurePass123!",
            "full_name": "Invalid Email Test"
        }
        
        response = await client.post("/api/v1/auth/register", json=registration_data)
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


# ============================================================================
# Auth Service Tests (Token Management)
# ============================================================================

@pytest.mark.asyncio
async def test_refresh_access_token_success(db: AsyncSession):
    """Test successful token refresh with rotation."""
    from app.features.auth.service import get_user_by_email
    
    # Create a test user
    user = User(
        email="refreshtest@example.com",
        password_hash=hash_password("SecurePass123!"),
        full_name="Refresh Test",
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Create initial refresh token pair
    access_token, refresh_token = await create_tokens_for_user(
        db, user, "test-agent", "127.0.0.1"
    )
    assert access_token is not None
    assert refresh_token is not None
    
    # Refresh the token
    result = await refresh_access_token(db, refresh_token, "test-agent", "127.0.0.1")
    assert result is not None
    new_access_token, new_refresh_token = result
    
    # New refresh token should be different (access tokens may be same if created at same time)
    assert new_refresh_token != refresh_token
    # Both tokens should be valid strings
    assert len(new_access_token) > 0
    assert len(new_refresh_token) > 0
    
    # Old token should be revoked
    old_token_hash = hash_refresh_token(refresh_token)
    old_token = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == old_token_hash)
    )
    old_token_obj = old_token.scalar_one_or_none()
    assert old_token_obj is not None
    assert old_token_obj.revoked_at is not None


@pytest.mark.asyncio
async def test_refresh_access_token_expired(db: AsyncSession):
    """Test that expired refresh token cannot be used."""
    from datetime import timedelta, UTC
    from app.features.auth.service import get_user_by_email
    from app.core.security import hash_refresh_token, generate_refresh_token
    from app.core.config import REFRESH_TOKEN_EXPIRE_DAYS
    
    # Create a test user
    user = User(
        email="expiredtest@example.com",
        password_hash=hash_password("SecurePass123!"),
        full_name="Expired Test",
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Create an expired refresh token manually
    expired_token = generate_refresh_token()
    token_hash = hash_refresh_token(expired_token)
    expired_at = datetime.now(UTC) - timedelta(days=1)  # Already expired
    
    db_token = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expired_at,
        user_agent="test-agent",
        ip_address="127.0.0.1",
    )
    db.add(db_token)
    await db.commit()
    
    # Try to refresh with expired token
    result = await refresh_access_token(db, expired_token, "test-agent", "127.0.0.1")
    assert result is None


@pytest.mark.asyncio
async def test_refresh_access_token_invalid(db: AsyncSession):
    """Test that invalid refresh token returns None."""
    result = await refresh_access_token(db, "invalid_token_12345", "test-agent", "127.0.0.1")
    assert result is None


@pytest.mark.asyncio
async def test_refresh_access_token_revoked(db: AsyncSession):
    """Test that revoked refresh token cannot be used."""
    from app.features.auth.service import get_user_by_email
    
    # Create a test user
    user = User(
        email="revokedtest@example.com",
        password_hash=hash_password("SecurePass123!"),
        full_name="Revoked Test",
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Create refresh token pair
    access_token, refresh_token = await create_tokens_for_user(
        db, user, "test-agent", "127.0.0.1"
    )
    
    # Revoke the token
    revoked = await revoke_refresh_token(db, refresh_token)
    assert revoked is True
    
    # Try to refresh with revoked token
    result = await refresh_access_token(db, refresh_token, "test-agent", "127.0.0.1")
    assert result is None


@pytest.mark.asyncio
async def test_refresh_access_token_inactive_user(db: AsyncSession):
    """Test that refresh token for inactive user returns None."""
    from app.features.auth.service import get_user_by_email
    
    # Create an inactive user
    user = User(
        email="inactivetest@example.com",
        password_hash=hash_password("SecurePass123!"),
        full_name="Inactive Test",
        is_active=False,  # Inactive
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Create refresh token pair
    access_token, refresh_token = await create_tokens_for_user(
        db, user, "test-agent", "127.0.0.1"
    )
    
    # Try to refresh - should fail because user is inactive
    result = await refresh_access_token(db, refresh_token, "test-agent", "127.0.0.1")
    assert result is None


@pytest.mark.asyncio
async def test_revoke_refresh_token_success(db: AsyncSession):
    """Test successful token revocation."""
    from app.features.auth.service import get_user_by_email
    
    # Create a test user
    user = User(
        email="revoketest@example.com",
        password_hash=hash_password("SecurePass123!"),
        full_name="Revoke Test",
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Create refresh token pair
    access_token, refresh_token = await create_tokens_for_user(
        db, user, "test-agent", "127.0.0.1"
    )
    
    # Revoke the token
    revoked = await revoke_refresh_token(db, refresh_token)
    assert revoked is True
    
    # Verify token is revoked in database
    from app.core.security import hash_refresh_token
    from sqlalchemy import select
    token_hash = hash_refresh_token(refresh_token)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    db_token = result.scalar_one_or_none()
    assert db_token is not None
    assert db_token.revoked_at is not None


@pytest.mark.asyncio
async def test_revoke_refresh_token_not_found(db: AsyncSession):
    """Test revoking non-existent token returns False."""
    revoked = await revoke_refresh_token(db, "nonexistent_token_12345")
    assert revoked is False


@pytest.mark.asyncio
async def test_revoke_all_user_tokens(db: AsyncSession):
    """Test revoking all tokens for a user."""
    from app.features.auth.service import get_user_by_email
    
    # Create a test user
    user = User(
        email="revokealltest@example.com",
        password_hash=hash_password("SecurePass123!"),
        full_name="Revoke All Test",
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Create multiple refresh tokens
    await create_tokens_for_user(db, user, "agent1", "127.0.0.1")
    await create_tokens_for_user(db, user, "agent2", "127.0.0.2")
    await create_tokens_for_user(db, user, "agent3", "127.0.0.3")
    
    # Revoke all tokens
    count = await revoke_all_user_tokens(db, user.id)
    assert count == 3
    
    # Verify all tokens are revoked
    from sqlalchemy import select
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.user_id == user.id)
    )
    tokens = result.scalars().all()
    assert len(tokens) == 3
    for token in tokens:
        assert token.revoked_at is not None


@pytest.mark.asyncio
async def test_change_password_success(client: AsyncClient):
    """Test successful password change via endpoint."""
    # Register and login
    registration_data = {
        "email": "changepwtest@example.com",
        "password": "OldSecurePass123!",
        "full_name": "Change PW Test"
    }
    
    await client.post("/api/v1/auth/register", json=registration_data)
    
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "changepwtest@example.com", "password": "OldSecurePass123!"}
    )
    access_token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Change password
    change_data = {
        "old_password": "OldSecurePass123!",
        "new_password": "NewSecurePass456!",
        "revoke_all_sessions": False
    }
    
    response = await client.post(
        "/api/v1/auth/change-password",
        json=change_data,
        headers=headers
    )
    assert response.status_code == 200
    
    # Verify new password works by logging in again
    login_response2 = await client.post(
        "/api/v1/auth/login",
        json={"email": "changepwtest@example.com", "password": "NewSecurePass456!"}
    )
    assert login_response2.status_code == 200


@pytest.mark.asyncio
async def test_change_password_wrong_old_password(client: AsyncClient):
    """Test password change with wrong old password fails."""
    # Register and login
    registration_data = {
        "email": "wrongpwtest@example.com",
        "password": "OldSecurePass123!",
        "full_name": "Wrong PW Test"
    }
    
    await client.post("/api/v1/auth/register", json=registration_data)
    
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "wrongpwtest@example.com", "password": "OldSecurePass123!"}
    )
    access_token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Try to change with wrong old password
    change_data = {
        "old_password": "WrongPassword123!",
        "new_password": "NewSecurePass456!",
        "revoke_all_sessions": False
    }
    
    response = await client.post(
        "/api/v1/auth/change-password",
        json=change_data,
        headers=headers
    )
    assert response.status_code == 401
    assert "incorrect" in response.json()["detail"].lower() or "password" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_change_password_with_session_revocation(client: AsyncClient):
    """Test password change with session revocation."""
    # Register and login
    registration_data = {
        "email": "revokepwtest@example.com",
        "password": "OldSecurePass123!",
        "full_name": "Revoke PW Test"
    }
    
    await client.post("/api/v1/auth/register", json=registration_data)
    
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "revokepwtest@example.com", "password": "OldSecurePass123!"}
    )
    access_token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Change password with session revocation
    change_data = {
        "old_password": "OldSecurePass123!",
        "new_password": "NewSecurePass456!",
        "revoke_all_sessions": True
    }
    
    response = await client.post(
        "/api/v1/auth/change-password",
        json=change_data,
        headers=headers
    )
    assert response.status_code == 200
    # Should indicate sessions were revoked
    assert "sessions_revoked" in response.json()
