# env configuration for the application
import os
from pathlib import Path


API_PREFIX: str = os.getenv("API_PREFIX", "/api")

ALLOWED_ORIGINS: list[str] = [
    o.strip() for o in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",") if o.strip()
]

MAX_UPLOAD_SIZE: int = int(os.getenv("MAX_UPLOAD_SIZE", 5 * 1024 * 1024))  # 5 MB

UPLOAD_DIR: Path = Path(os.getenv("UPLOAD_DIR", "/tmp/portfolio_uploads")).absolute()
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# allow-list of MIME types
ALLOWED_MIME: set[str] = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
}

# Database configuration
# If DATABASE_URL provided, use it; otherwise build from individual env vars.
_POSTGRES_USER = os.getenv("POSTGRES_USER", "app")
_POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "app")
_POSTGRES_DB = os.getenv("POSTGRES_DB", "app")
_POSTGRES_HOST = os.getenv("POSTGRES_HOST", "db")  # "db" is the service name in docker-compose
_POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")

_DATABASE_URL_FROM_ENV = os.getenv("DATABASE_URL")
if _DATABASE_URL_FROM_ENV and _DATABASE_URL_FROM_ENV.strip():
    DATABASE_URL: str = _DATABASE_URL_FROM_ENV
else:
    # SQLAlchemy URL using psycopg
    DATABASE_URL: str = (
        f"postgresql+psycopg://{_POSTGRES_USER}:{_POSTGRES_PASSWORD}@{_POSTGRES_HOST}:{_POSTGRES_PORT}/{_POSTGRES_DB}"
    )