"""add portfolio draft and site tables

Revision ID: dde169cc682e
Revises: d1592f313169
Create Date: 2025-10-09 13:11:19.956886

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


"""add portfolio draft and site tables"""

# revision identifiers, used by Alembic.
revision = 'dde169cc682e'
down_revision = 'd1592f313169'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- portfolios_draft ---
    op.create_table(
        'portfolios_draft',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.BigInteger(), nullable=False, index=True),
        sa.Column('about', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('contact', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('sections_order', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('sections_visibility', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('version', sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column('created_at', sa.DateTime(timezone=False), nullable=False, server_default=sa.text("now()")),
        sa.Column('updated_at', sa.DateTime(timezone=False), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index('ix_portfolios_draft_user', 'portfolios_draft', ['user_id'])
    op.create_check_constraint('ck_portfolios_draft_version_pos', 'portfolios_draft', 'version >= 1')

    # --- portfolio_sites ---
    op.create_table(
        'portfolio_sites',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.BigInteger(), nullable=False, index=True),
        sa.Column('slug', sa.String(length=100), nullable=False, unique=True),
        sa.Column('custom_domain', sa.String(length=255), nullable=True),
        sa.Column('theme_key', sa.String(length=50), nullable=True),
        sa.Column('theme_version', sa.String(length=20), nullable=False, server_default=sa.text("'1.0.0'")),
        sa.Column('status', sa.String(length=30), nullable=False, server_default=sa.text("'draft'")),
        sa.Column('seo', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('public_contact', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('content', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('last_published_at', sa.DateTime(timezone=False), nullable=True),
        sa.Column('build_version', sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column('created_at', sa.DateTime(timezone=False), nullable=False, server_default=sa.text("now()")),
        sa.Column('updated_at', sa.DateTime(timezone=False), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index('ix_portfolio_sites_user', 'portfolio_sites', ['user_id'])
    op.create_index('ux_portfolio_sites_slug', 'portfolio_sites', ['slug'], unique=True)
    op.create_check_constraint('ck_portfolio_sites_build_version_pos', 'portfolio_sites', 'build_version >= 1')

    # --- site_builds ---
    op.create_table(
        'site_builds',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('site_id', sa.BigInteger(), nullable=False, index=True),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('logs', sa.Text(), nullable=True),
        sa.Column('duration_ms', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=False), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index('ix_site_builds_site', 'site_builds', ['site_id'])


def downgrade() -> None:
    op.drop_index('ix_site_builds_site', table_name='site_builds')
    op.drop_table('site_builds')

    # FIX: Use drop_constraint instead of drop_check_constraint
    op.drop_constraint('ck_portfolio_sites_build_version_pos', table_name='portfolio_sites', type_='check')
    op.drop_index('ux_portfolio_sites_slug', table_name='portfolio_sites')
    op.drop_index('ix_portfolio_sites_user', table_name='portfolio_sites')
    op.drop_table('portfolio_sites')

    # FIX: Use drop_constraint instead of drop_check_constraint
    op.drop_constraint('ck_portfolios_draft_version_pos', table_name='portfolios_draft', type_='check')
    op.drop_index('ix_portfolios_draft_user', table_name='portfolios_draft')
    op.drop_table('portfolios_draft')
