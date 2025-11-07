# env configuration for the application
import os
from pathlib import Path


SECRET_KEY: str = os.getenv("SECRET_KEY", "")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY required")

ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_DOMAIN: str = os.getenv("COOKIE_DOMAIN", "")
COOKIE_SAMESITE: str = os.getenv("COOKIE_SAMESITE", "lax")
BCRYPT_ROUNDS: int = int(os.getenv("BCRYPT_ROUNDS", "12"))


API_PREFIX: str = os.getenv("API_PREFIX", "/api")

ALLOWED_ORIGINS: list[str] = [
    o.strip() for o in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,http://localhost:9000"
    ).split(",") if o.strip()
]


MAX_UPLOAD_SIZE: int = int(os.getenv("MAX_UPLOAD_SIZE", 5 * 1024 * 1024))  # 5 MB
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/app/uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# allow-list of MIME types
ALLOWED_MIME: set[str] = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
}