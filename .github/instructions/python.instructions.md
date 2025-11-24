---
description: 'Python coding conventions and guidelines for Portfolio Builder backend'
applyTo: '**/*.py'
---

# Python Coding Conventions

## Project Context
This file provides general Python guidelines. For FastAPI/SQLAlchemy/Pydantic-specific patterns, see `.github/instructions/backend.instructions.md`.

---

## Python Instructions

- Write clear and concise comments for each function.
- Ensure functions have descriptive names and include type hints.
- Provide docstrings following PEP 257 conventions.
- Use the `typing` module when needed, but prefer modern `list[str]`, `dict[str, int]` forms on Python 3.10+.
- Break down complex functions into smaller, more manageable functions.

## General Instructions

- Prioritize readability and clarity.
- For algorithm-related code, include explanations of the approach used.
- Maintainability: comment on why certain design decisions were made.
- Handle edge cases and write clear exception handling.
- For external dependencies, mention their usage and purpose in comments.
- Use consistent naming conventions and follow best practices.
- Write concise, efficient, and idiomatic code.

## Code Style and Formatting

- Follow PEP 8.
- Indentation: 4 spaces.
- Line length: 88 (compatible with `black`).
- Place function and class docstrings immediately after `def` or `class`.
- Use blank lines to separate logical sections.

## Edge Cases and Testing

- Include test cases for critical paths.
- Consider empty inputs, invalid data types, and large datasets.
- Document expected behavior for edge cases.
- Write unit tests and document them with docstrings explaining the test cases.

## Examples

```python
from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

class User: ...


def calculate_area(radius: float) -> float:
    """
    Calculate the area of a circle given the radius.
    
    Args:
        radius: The radius of the circle.
    
    Returns:
        The area of the circle, calculated as π * radius².
    
    Raises:
        ValueError: If radius is negative.
    
    Example:
        >>> calculate_area(5.0)
        78.53981633974483
    """
    if radius < 0:
        raise ValueError("Radius must be non-negative")
    import math
    return math.pi * radius ** 2


async def fetch_user_by_email(email: str, db: AsyncSession) -> Optional[User]:
    """
    Fetch a user from the database by email address.
    
    Uses SQLAlchemy 2.0 async patterns and returns None when not found.
    """
    if not email or "@" not in email:
        raise ValueError("Invalid email format")
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()
```

---

## Project-Specific Patterns

### Async Functions
- Always use `async`/`await` for database I/O.
- Always use `async with` for sessions and file operations.
- Never use blocking I/O in async functions.

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

async def get_resume(resume_id: int, db: AsyncSession):
    stmt = select(Resume).where(Resume.id == resume_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()
```

### Pydantic v2 Models
- Use `@field_validator` (not `@validator`).
- Use `model_dump()` (not `.dict()`).
- Inherit from project base classes in `app/shared/schemas.py`.

```python
from pydantic import Field, field_validator
from app.shared.schemas import APIModel

class UserCreate(APIModel):
    email: str = Field(..., description="User email address")
    name: str
    
    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if "@" not in v:
            raise ValueError("Invalid email format")
        return v.lower()
```

### Error Handling
- Use `HTTPException` for API errors with proper status codes.
- Log errors before raising.
- Provide meaningful messages to users.

```python
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)

async def process_upload(file: UploadFile) -> dict:
    try:
        content = await file.read()
        return parse_content(content)
    except ValueError as e:
        logger.error("Validation error: %s", e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        logger.exception("Unexpected error during upload")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unexpected error")
```

### Modern Type Hints
```python
from typing import Any

def process_data(value: str | int | None) -> dict[str, Any]:
    result: list[str] = []
    return {"data": result}
```

---

## Code Quality Checklist

- [ ] All functions have type hints
- [ ] Public functions have docstrings
- [ ] No unused imports or variables
- [ ] Code formatted with `black`
- [ ] Lint passes (`ruff`)
- [ ] Unit tests present and passing
- [ ] Async functions use `await` for I/O
- [ ] Pydantic models use v2 syntax
- [ ] Specific exception types used

---

## Tools & Commands

```bash
black backend/app/
ruff check backend/app/
mypy backend/app/
pytest backend/app/tests/
pytest backend/app/tests/test_resumes.py -k "test_upload"
```

---

Last Updated: October 2025
Maintained By: Backend Team (Daniel)
