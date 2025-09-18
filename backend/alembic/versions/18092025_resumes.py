from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql as psql

revision = "18092025_resumes"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    parse_status = sa.Enum("pending", "parsing", "success", "failed", name="parse_status")
    parse_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "resumes",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.BigInteger(), nullable=True),
        sa.Column("source_file_id", sa.BigInteger(), nullable=True),
        sa.Column("original_name", sa.String(length=255), nullable=True),
        sa.Column("parsed_json", psql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("parse_status", parse_status, nullable=False, server_default=sa.text("'pending'")),
        sa.Column("version", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_resumes_status", "resumes", ["parse_status"], unique=False)
    op.create_index("ix_resumes_updated_at", "resumes", ["updated_at"], unique=False)
    op.create_index("uq_resumes_user_primary", "resumes", ["user_id"], unique=True, postgresql_where=sa.text("is_primary = true"))

def downgrade():
    op.drop_index("uq_resumes_user_primary", table_name="resumes")
    op.drop_index("ix_resumes_updated_at", table_name="resumes")
    op.drop_index("ix_resumes_status", table_name="resumes")
    op.drop_table("resumes")
    sa.Enum(name="parse_status").drop(op.get_bind(), checkfirst=True)
