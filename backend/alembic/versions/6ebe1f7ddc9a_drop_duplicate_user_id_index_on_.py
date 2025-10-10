from alembic import op


revision = "6ebe1f7dcc9a"
down_revision = "6567846bfb43"  # זו המיגרציה האחרונה  (add_resume_source_id...)

def upgrade() -> None:
    op.drop_index("ix_portfolios_draft_user", table_name="portfolios_draft")

def downgrade() -> None:
    op.create_index(
        "ix_portfolios_draft_user",
        "portfolios_draft",
        ["user_id"],
        unique=False,
    )
