"""make_user_id_required_in_resumes

Revision ID: eacb2a630c15
Revises: 6d40c888e256
Create Date: 2025-11-24 11:40:48.876312

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'eacb2a630c15'
down_revision: Union[str, None] = '6d40c888e256'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### Make user_id required in resumes table ###
    
    # Step 1: Delete any orphan resumes (resumes without a user)
    # This ensures we can safely make the column NOT NULL
    op.execute("DELETE FROM resumes WHERE user_id IS NULL")
    
    # Step 2: Make user_id column NOT NULL
    op.alter_column('resumes', 'user_id',
                    existing_type=sa.BigInteger(),
                    nullable=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### Allow user_id to be nullable again ###
    op.alter_column('resumes', 'user_id',
                    existing_type=sa.BigInteger(),
                    nullable=True)
    # ### end Alembic commands ###
