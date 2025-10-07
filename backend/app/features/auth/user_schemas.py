from datetime import datetime
from pydantic import EmailStr
from app.shared.schemas import IDModel, Timestamped

# User info used across API responses.
class UserOut(IDModel, Timestamped):
    email: EmailStr
    full_name: str
    headline: str | None = None
    location: str | None = None
    timezone: str | None = None
    languages: list[str] = []
    phone_e164: str | None = None
    updated_at: datetime | None = None