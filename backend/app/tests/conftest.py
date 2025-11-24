# Ensure the backend root is on sys.path so `from app.main import app` works
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]  # points to backend/
if str(ROOT) not in sys.path:
	sys.path.insert(0, str(ROOT))

# fixtures (TestClient, temp DB)
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.main import app
from app.core.db import get_db
from app.db.base import Base
import os

# Test database URL (Docker environment - use fresh test DB)
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://portfolioBLDUser:XX2025portfolioPW!@db:5432/portfoliodb_test2"
)


@pytest_asyncio.fixture
async def db_engine():
	"""Create test database engine (assumes migrations already run)."""
	engine = create_async_engine(TEST_DATABASE_URL, echo=False)
	
	yield engine
	
	# Clean up after tests (delete all data but keep schema)
	async with engine.begin() as conn:
		# Delete data from all tables in reverse order (respect FK constraints)
		for table in reversed(Base.metadata.sorted_tables):
			await conn.execute(table.delete())
		await conn.commit()
	
	await engine.dispose()


@pytest_asyncio.fixture
async def db(db_engine):
	"""Create test database session."""
	async_session = async_sessionmaker(
		db_engine, class_=AsyncSession, expire_on_commit=False
	)
	
	async with async_session() as session:
		yield session


@pytest_asyncio.fixture
async def client(db):
	"""Create test HTTP client with database dependency override."""
	from app.core.rate_limiting import rate_limiter
	
	async def override_get_db():
		yield db
	
	app.dependency_overrides[get_db] = override_get_db
	
	# Clear rate limiter state before each test
	rate_limiter._requests.clear()
	
	async with AsyncClient(
		transport=ASGITransport(app=app),
		base_url="http://test"
	) as ac:
		yield ac
	
	app.dependency_overrides.clear()
	# Clear rate limiter state after test
	rate_limiter._requests.clear()