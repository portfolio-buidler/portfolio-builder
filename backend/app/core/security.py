"""Security utilities for authentication: JWT, password hashing, and auth dependencies."""
import secrets
import hashlib
from datetime import datetime, timedelta, UTC
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
import bcrypt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import (
    SECRET_KEY,
    JWT_ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
    COOKIE_SECURE,
    COOKIE_DOMAIN,
    COOKIE_SAMESITE,
    BCRYPT_ROUNDS,
)
from app.core.db import get_db
from app.core.errors import AuthenticationError, InvalidTokenError


# ============================================================================
# Password Hashing (Bcrypt)
# ============================================================================

def hash_password(plain_password: str) -> str:
    """Hash a plain password using bcrypt."""
    # Convert password to bytes and generate salt
    password_bytes = plain_password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
    # Hash and return as string
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


# ============================================================================
# JWT Access Token
# ============================================================================

def create_access_token(user_id: int, email: str) -> str:
    """Create a JWT access token for a user."""
    expire = datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": expire,
        "iat": datetime.now(UTC),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        email = payload.get("email")
        if not user_id or not email:
            raise InvalidTokenError("Missing claims in token")
        return {"user_id": int(user_id), "email": email}
    except JWTError as e:
        raise InvalidTokenError(f"Invalid token: {e}")


# ============================================================================
# Refresh Token (Opaque)
# ============================================================================

def generate_refresh_token() -> str:
    """Generate a secure random refresh token (64-character hex string)."""
    return secrets.token_hex(32)


def hash_refresh_token(token: str) -> str:
    """Hash a refresh token using SHA256 for database storage."""
    return hashlib.sha256(token.encode()).hexdigest()


# ============================================================================
# Cookie Helpers
# ============================================================================

def create_refresh_token_cookie(token: str) -> dict:
    """Create cookie parameters for setting a refresh token."""
    max_age = REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    return {
        "key": "refresh_token",
        "value": token,
        "max_age": max_age,
        "httponly": True,
        "secure": COOKIE_SECURE,
        "samesite": COOKIE_SAMESITE,
        "domain": COOKIE_DOMAIN or None,
        "path": "/",
    }


def clear_refresh_token_cookie() -> dict:
    """Create cookie parameters for clearing a refresh token.

    Adds both max_age=0 and an expires date in the past to ensure all
    browsers drop the cookie immediately (some dev setups with domain/path
    mismatches ignore only max_age)."""
    return {
        "key": "refresh_token",
        "value": "",
        "max_age": 0,
        "expires": "Thu, 01 Jan 1970 00:00:00 GMT",
        "httponly": True,
        "secure": COOKIE_SECURE,
        "samesite": COOKIE_SAMESITE,
        "domain": COOKIE_DOMAIN or None,
        "path": "/",
    }


# ============================================================================
# FastAPI Authentication Dependency
# ============================================================================

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """
    FastAPI dependency to get the current authenticated user.
    
    Extracts JWT from Authorization header, validates it, and returns the User object.
    Raises AuthenticationError (401) if token is invalid or user not found.
    """
    if not credentials:
        raise AuthenticationError("Missing authentication credentials")
    
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        user_id = payload["user_id"]
    except InvalidTokenError as e:
        raise AuthenticationError(str(e))
    
    # Import here to avoid circular dependency
    from app.db.models_user import User
    
    # Use async query with SQLAlchemy 2.0 style
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise AuthenticationError("User not found or inactive")
    
    return user