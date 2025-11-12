from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "6567846bfb43"
down_revision: str = "dde169cc682e"  # זה ה-ID של המיגרציה הקודמת שלך
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("portfolios_draft", sa.Column("resume_source_id", sa.BigInteger(), nullable=True))
    op.create_index(op.f("ix_portfolios_draft_resume_source_id"), "portfolios_draft", ["resume_source_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_portfolios_draft_resume_source_id"), table_name="portfolios_draft")
    op.drop_column("portfolios_draft", "resume_source_id")
