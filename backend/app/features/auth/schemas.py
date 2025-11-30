from datetime import datetime
from typing_extensions import Annotated
from pydantic import EmailStr, Field, SecretStr, StringConstraints, constr, field_validator
from app.shared.schemas import APIModel, IDModel, Timestamped

FullName = Annotated[str, StringConstraints(min_length=1, max_length=30)]
Headline = Annotated[str, StringConstraints(min_length=1, max_length=60)]
Phone = Annotated[str, StringConstraints(pattern=r"^(?:\+972|0)(5[0-9])[-]?\d{7}$")]

# Schema for user registration request
class RegisterRequest(APIModel):
    email: EmailStr
    password: SecretStr = Field(min_length=8, description="hash server-side")
    full_name: FullName = Field(..., description="User's full name")
    
    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, v: SecretStr) -> SecretStr:
        """Validate password contains both letters and numbers."""
        password = v.get_secret_value()
        has_letters = any(c.isalpha() for c in password)
        has_numbers = any(c.isdigit() for c in password)
        
        if not has_letters:
            raise ValueError("Password must contain at least one letter")
        if not has_numbers:
            raise ValueError("Password must contain at least one number")
        
        return v

# User login authentication request
class LoginRequest(APIModel):
    email: EmailStr
    password: SecretStr

# Tokens returned after successful authentication.
class TokenPair(APIModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

# Public safe user profile returned from the API. Excludes sensitive fields like email and phone.
class UserPublic(IDModel, Timestamped):
    email: EmailStr
    full_name: str | None = None
    headline: str | None = None
    location: str | None = None
    timezone: str | None = None
    languages: dict | None = None  # JSONB field from database
    phone: str | None = None
    updated_at: datetime | None = None
    
# Editable fields for user profile updates.
class UpdateProfile(APIModel):
    full_name: FullName | None = None
    headline: Headline | None = None
    location: str | None = None
    timezone: str | None = None
    languages: list[str] | None = None
    phone: Phone | None = None

# Password change request with optional session revocation.
class ChangePasswordRequest(APIModel):
    old_password: SecretStr
    new_password: SecretStr = Field(min_length=8, description="New password (min 8 chars)")
    revoke_all_sessions: bool = Field(default=False, description="Logout from all devices after password change")