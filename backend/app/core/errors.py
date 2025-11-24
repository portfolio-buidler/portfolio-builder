"""Custom exception classes for authentication and authorization errors."""
from fastapi import HTTPException, status


class AuthenticationError(HTTPException):
    """Base authentication error - 401 Unauthorized."""
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class AuthorizationError(HTTPException):
    """Authorization error - 403 Forbidden."""
    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )


class TokenExpiredError(AuthenticationError):
    """Token has expired."""
    def __init__(self):
        super().__init__(detail="Token expired")


class InvalidTokenError(AuthenticationError):
    """Token is invalid or malformed."""
    def __init__(self, detail: str = "Invalid token"):
        super().__init__(detail=detail)


class ConflictError(HTTPException):
    """Conflict error - 409 Conflict."""
    def __init__(self, detail: str = "Resource conflict"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail
        )