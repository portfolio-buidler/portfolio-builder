"""switch draft timestamps to timestamptz

Revision ID: 1df0ff8a794c
Revises: 073c06dc79b7
Create Date: 2025-10-16 09:16:19.842529

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1df0ff8a794c'
down_revision: Union[str, None] = '073c06dc79b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.alter_column(
        "portfolios_draft", "created_at",
        type_=sa.TIMESTAMP(timezone=True),
        postgresql_using="created_at AT TIME ZONE 'UTC'"
    )
    op.alter_column(
        "portfolios_draft", "updated_at",
        type_=sa.TIMESTAMP(timezone=True),
        postgresql_using="updated_at AT TIME ZONE 'UTC'"
    )

def downgrade():
    op.alter_column(
        "portfolios_draft", "updated_at",
        type_=sa.TIMESTAMP(timezone=False),
        postgresql_using="updated_at AT TIME ZONE 'UTC'"
    )
    op.alter_column(
        "portfolios_draft", "created_at",
        type_=sa.TIMESTAMP(timezone=False),
        postgresql_using="created_at AT TIME ZONE 'UTC'"
    )