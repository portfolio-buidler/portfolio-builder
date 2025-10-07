from datetime import datetime
from typing_extensions import Annotated
from pydantic import EmailStr, Field, SecretStr, StringConstraints, constr
from app.shared.schemas import APIModel, IDModel, Timestamped

FullName = Annotated[str, StringConstraints(min_length=1, max_length=30)]
Headline = Annotated[str, StringConstraints(min_length=1, max_length=60)]
Phone = Annotated[str, StringConstraints(pattern=r"^(?:\+972|0)(5[0-9])[-]?\d{7}$")]

# Schema for user registration request
class RegisterRequest(APIModel):
    email: EmailStr
    password: SecretStr = Field(min_length=8, description="hash server-side")
    full_name: FullName
    headline: Headline | None = None
    location: str | None = None
    timezone: str | None = None
    languages: list[str] = []
    phone: Phone | None = None

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
    full_name: FullName
    headline: Headline | None = None
    location: str | None = None
    timezone: str | None = None
    languages: list[str] = []
    phone: Phone | None = None
    updated_at: datetime | None = None
    
# Editable fields for user profile updates.
class UpdateProfile(APIModel):
    full_name: FullName | None = None
    headline: Headline | None = None
    location: str | None = None
    timezone: str | None = None
    languages: list[str] | None = None
    phone: Phone | None = None