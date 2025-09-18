from __future__ import annotations
from datetime import datetime
from enum import StrEnum
from typing import Optional

from sqlalchemy import (
    BigInteger, String, Text, Boolean, ForeignKey, UniqueConstraint,
    func, text, Enum, CheckConstraint, Index
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB

class Base(DeclarativeBase): pass

class ParseStatus(StrEnum):
    pending = "pending"
    failed = "failed"
    parsed = "parsed"

class FileKind(StrEnum):
    resume = "resume"
    avatar = "avatar"
    project_image = "project_image"

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[Optional[str]] = mapped_column(String(200))
    headline: Mapped[Optional[str]] = mapped_column(String(200))
    location: Mapped[Optional[str]] = mapped_column(String(120))
    timezone: Mapped[Optional[str]] = mapped_column(String(64))
    languages: Mapped[Optional[str]] = mapped_column(String(255))
    phone: Mapped[Optional[str]] = mapped_column(String(40))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    files: Mapped[list[File]] = relationship(back_populates="user")
    resumes: Mapped[list[Resume]] = relationship(back_populates="user")

class File(Base):
    __tablename__ = "files"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    kind: Mapped[FileKind] = mapped_column(Enum(FileKind, name="file_kind", native_enum=True))
    type: Mapped[str] = mapped_column(String(32))  # mime/extension
    storage_path: Mapped[str] = mapped_column(Text)
    size_bytes: Mapped[int] = mapped_column(BigInteger)
    checksum: Mapped[Optional[str]] = mapped_column(String(64), index=True)
    uploaded_at: Mapped[datetime] = mapped_column(server_default=func.now())

    user: Mapped[User] = relationship(back_populates="files")

class Resume(Base):
    __tablename__ = "resumes"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    source_file_id: Mapped[Optional[int]] = mapped_column(ForeignKey("files.id", ondelete="SET NULL"), nullable=True)
    file_name: Mapped[str] = mapped_column(String(255))
    is_primary: Mapped[bool] = mapped_column(Boolean, server_default=text("false"), index=True)
    parsed_json: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    parse_status: Mapped[ParseStatus] = mapped_column(Enum(ParseStatus, name="parse_status", native_enum=True), default=ParseStatus.pending)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    user: Mapped[User] = relationship(back_populates="resumes")
    source_file: Mapped[Optional[File]] = relationship()
