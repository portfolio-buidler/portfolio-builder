from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL="postgresql+asyncpg://app_user:app_pass@localhost:5432/portfolio"
ALEMBIC_DATABASE_URL="postgresql://app_user:app_pass@localhost:5432/portfolio"


engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
AsyncSessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session