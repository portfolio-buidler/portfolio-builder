from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass

# Import all models for Alembic auto-generation
from app.db.models_user import User
from app.db.models_refresh_token import RefreshToken
from app.db.models_resume import Resume