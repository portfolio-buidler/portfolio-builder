from datetime import datetime
from sqlalchemy import BigInteger, Boolean, CheckConstraint, Enum, Integer, String, text, func, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
from app.shared.enums import ParseStatus  
class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True, index=True)
    source_file_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)

    original_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    parsed_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    parse_status: Mapped[ParseStatus] = mapped_column(
        Enum(ParseStatus, name="parse_status", native_enum=True),
        nullable=False,
        server_default=text("'pending'")
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("1"))
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))

    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        Index("ix_resumes_status", "parse_status"),
        Index("ix_resumes_updated_at", "updated_at"),
        Index("uq_resumes_user_primary", "user_id", unique=True, postgresql_where=text("is_primary = true")),
        CheckConstraint("version >= 1", name="ck_resumes_version_pos"),
    )
