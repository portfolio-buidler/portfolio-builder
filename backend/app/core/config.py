# env configuration for the application
import os
from pathlib import Path


API_PREFIX: str = os.getenv("API_PREFIX", "/api")

ALLOWED_ORIGINS: list[str] = [
    o.strip() for o in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
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