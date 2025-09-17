from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import DATABASE_URL

# Engine
engine = create_engine(
    DATABASE_URL,
    future=True,
    pool_pre_ping=True,
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True,
)

# Declarative Base for models to inherit from
Base = declarative_base()

# Dependency for FastAPI routes (example usage in routes):
#   from fastapi import Depends
#   from app.core.db import get_db
#   def endpoint(db: Session = Depends(get_db)):
#       ...

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
