"""
Initial migration: create resumes table and related enum/indexes

Revision ID: 0001
Revises: 
Create Date: 2025-09-18 00:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ensure enum type for parse_status exists (idempotent for re-runs)
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'parse_status') THEN
                CREATE TYPE parse_status AS ENUM ('pending','parsing','success','failed');
            END IF;
        END$$;
        """
    )

    op.create_table(
        "resumes",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.BigInteger(), nullable=True),
        sa.Column("source_file_id", sa.BigInteger(), nullable=True),
        sa.Column("original_name", sa.String(length=255), nullable=True),
        sa.Column("parsed_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "parse_status",
            postgresql.ENUM(
                "pending",
                "parsing",
                "success",
                "failed",
                name="parse_status",
                create_type=False,
            ),
            nullable=False,
            server_default=sa.text("'pending'"),
        ),
        sa.Column("version", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint("version >= 1", name="ck_resumes_version_pos"),
    )

    # Indexes including partial unique index on (user_id) when is_primary=true
    op.create_index("ix_resumes_status", "resumes", ["parse_status"], unique=False)
    op.create_index("ix_resumes_updated_at", "resumes", ["updated_at"], unique=False)
    op.create_index(
        "uq_resumes_user_primary",
        "resumes",
        ["user_id"],
        unique=True,
        postgresql_where=sa.text("is_primary = true"),
    )


def downgrade() -> None:
    op.drop_index("uq_resumes_user_primary", table_name="resumes")
    op.drop_index("ix_resumes_updated_at", table_name="resumes")
    op.drop_index("ix_resumes_status", table_name="resumes")
    op.drop_table("resumes")
    # Drop enum type
    op.execute("DROP TYPE IF EXISTS parse_status")
