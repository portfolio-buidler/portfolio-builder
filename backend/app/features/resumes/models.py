from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Resume(Base):
    __tablename__ = "resumes"
    id = Column(Integer, primary_key=True)
    file_id = Column(String(128), unique=True, nullable=False)
    original_name = Column(String(128), nullable=False)
    mime_type = Column(String(64), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    is_primary = Column(Boolean, default=False)