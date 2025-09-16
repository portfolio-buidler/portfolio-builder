from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from typing import Generic, TypeVar

T = TypeVar('T')

# Base API model with strict configuration for all schemas
class APIModel(BaseModel):
    model_config = ConfigDict(
        strict=True,
        extras='forbid',
        populate_by_name=True,
        str_strip_whitespace=True,
    )
    
# Generic API response model to ensure timestamps are included
class Timestamped(APIModel):
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
# Model with an integer ID field
class IDModel(APIModel):
    id: int

# Generic pagination model, lets you paginate any type of item 
class Page(APIModel, Generic[T]):
    items: list[T]
    total: int = Field(ge=0)
    next_cursor: str | None = None