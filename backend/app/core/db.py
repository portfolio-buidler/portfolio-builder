"""
Database setup for the backend (async SQLAlchemy).

- Reads connection strings from environment (.env is loaded).
- Uses asyncpg (async driver) for SQLAlchemy.
- Provides a single async session factory and a FastAPI-friendly dependency.
"""

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load variables from .env so local dev works without exporting envs
load_dotenv()

# Main DB URLs (Alembic may use its own sync URL; we keep both)
DATABASE_URL = os.getenv("DATABASE_URL")
ALEMBIC_DATABASE_URL = os.getenv("ALEMBIC_DATABASE_URL")

# Safety: if someone set a sync driver by mistake, switch to asyncpg
if DATABASE_URL and DATABASE_URL.startswith("postgresql+psycopg2"):
    DATABASE_URL = DATABASE_URL.replace("psycopg2", "asyncpg")

# Create a single async engine; pool_pre_ping keeps connections fresh
engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)

# Factory that creates AsyncSession objects; expire_on_commit=False keeps loaded data usable after commit
AsyncSessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def get_db() -> AsyncSession:
    """
    FastAPI dependency: yields a single AsyncSession per request,
    and closes it automatically when the request ends.
    """
    async with AsyncSessionLocal() as session:
        yield session
