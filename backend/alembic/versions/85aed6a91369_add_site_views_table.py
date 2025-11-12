"""add site_views table

Revision ID: 85aed6a91369
Revises: 1df0ff8a794c
Create Date: 2025-11-02 11:32:22.925582

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '85aed6a91369'
down_revision: Union[str, None] = '1df0ff8a794c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.create_table(
        "site_views",
        sa.Column("id", sa.BigInteger, primary_key=True),
        sa.Column("site_id", sa.BigInteger, nullable=False, index=True),
        sa.Column("viewed_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

def downgrade():
    op.drop_table("site_views")