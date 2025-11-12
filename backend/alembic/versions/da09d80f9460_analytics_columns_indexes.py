"""analytics columns + indexes

Revision ID: da09d80f9460
Revises: 85aed6a91369
Create Date: 2025-11-02 13:09:44.245627

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'da09d80f9460'
down_revision: Union[str, None] = '85aed6a91369'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade():
    # Columns
    op.add_column("site_views", sa.Column("ip_hash", sa.Text(), nullable=True))
    op.add_column("site_views", sa.Column("referrer", sa.Text(), nullable=True))
    op.add_column("site_views", sa.Column("user_agent", sa.Text(), nullable=True))
    op.add_column("site_views", sa.Column("viewed_on", sa.Date(), server_default=sa.text("CURRENT_DATE"), nullable=False))

    # Indexes / constraints
    op.create_index("ix_site_views_site_ts", "site_views", ["site_id", "viewed_at"])
    op.create_unique_constraint("uq_site_views_dedup", "site_views", ["site_id", "ip_hash", "viewed_on"])

def downgrade():
    op.drop_constraint("uq_site_views_dedup", "site_views", type_="unique")
    op.drop_index("ix_site_views_site_ts", table_name="site_views")
    op.drop_column("site_views", "viewed_on")
    op.drop_column("site_views", "user_agent")
    op.drop_column("site_views", "referrer")
    op.drop_column("site_views", "ip_hash")