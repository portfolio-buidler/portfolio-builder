import pytest
import sqlalchemy
from sqlalchemy import create_engine, text
from app.tests.utils_migrations import SYNC_DB_URL, TEST_DB_NAME, run_upgrade, run_downgrade
from app.core.config import POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_PORT

# Main Admin URL to create/drop the test database
ADMIN_DB_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@db:{POSTGRES_PORT}/{POSTGRES_DB}"


@pytest.fixture(scope="module")
def setup_migration_db():
    """
    Creates a fresh database for migration testing and drops it afterwards.
    """
    # Connect to default DB to create the test DB
    engine = create_engine(ADMIN_DB_URL, isolation_level="AUTOCOMMIT")

    # Drop if exists
    try:
        with engine.connect() as conn:
            conn.execute(text(f"DROP DATABASE IF EXISTS {TEST_DB_NAME}"))
            conn.execute(text(f"CREATE DATABASE {TEST_DB_NAME}"))
    except Exception as e:
        pytest.fail(f"Could not setup migration database: {e}")

    yield

    # Cleanup
    with engine.connect() as conn:
        # Terminate connections to allow drop
        conn.execute(text(f"""
            SELECT pg_terminate_backend(pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = '{TEST_DB_NAME}'
            AND pid <> pg_backend_pid();
        """))
        conn.execute(text(f"DROP DATABASE IF EXISTS {TEST_DB_NAME}"))
    engine.dispose()


def test_migrations_up_and_down(setup_migration_db):
    """
    Verifies that we can upgrade to head and downgrade to base without errors.
    This ensures the migration chain is valid and reversible.
    """
    # 1. Upgrade to Head
    try:
        run_upgrade("head")
    except Exception as e:
        pytest.fail(f"Migration UPGRADE failed: {e}")

    # 2. Verify tables exist (Spot check: 'users' table should exist)
    engine = create_engine(SYNC_DB_URL)
    inspector = sqlalchemy.inspect(engine)
    tables = inspector.get_table_names()
    assert "users" in tables
    assert "resumes" in tables
    assert "alembic_version" in tables

    # 3. Downgrade to Base
    try:
        run_downgrade("base")
    except Exception as e:
        pytest.fail(f"Migration DOWNGRADE failed: {e}")

    # 4. Verify tables are gone (except alembic_version usually remains empty or table gone depending on config)
    # In a pure downgrade base, business tables should be gone.
    inspector = sqlalchemy.inspect(engine)
    tables = inspector.get_table_names()
    assert "users" not in tables
    assert "resumes" not in tables