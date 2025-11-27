from alembic.config import Config
from alembic import command
from app.core.config import POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_PORT, POSTGRES_HOST
import os

TEST_DB_NAME = "test_migrations_db"

# Sync URL for setup/teardown (creating the DB)
SYNC_DB_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{TEST_DB_NAME}"
# Async URL for Alembic execution (since env.py uses create_async_engine)
ASYNC_DB_URL = f"postgresql+asyncpg://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{TEST_DB_NAME}"

def get_alembic_config():
    """
    Returns an alembic config object pointing to the test database.
    """
    # Point to the alembic.ini file in the backend root
    base_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    ini_path = os.path.join(base_path, "alembic.ini")

    alembic_cfg = Config(ini_path)
    # IMPORTANT: Override with the ASYNC url so env.py can use it
    alembic_cfg.set_main_option("sqlalchemy.url", ASYNC_DB_URL)
    return alembic_cfg


def run_upgrade(target="head"):
    command.upgrade(get_alembic_config(), target)


def run_downgrade(target="base"):
    command.downgrade(get_alembic_config(), target)