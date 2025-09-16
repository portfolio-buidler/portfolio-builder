from typing import Annotated
from pydantic import Field, HttpUrl, StrictInt, StrictStr, StringConstraints
from app.shared.schemas import APIModel, IDModel, Timestamped

SafeTag = Annotated[str, StringConstraints(pattern=r"^[A-Za-z0-9_.+\-#]{1,32}$", strip_whitespace=True)]

# Individual metric item for a project
class MetricItem(APIModel):
    label: StrictStr
    value: StrictStr | StrictInt | None = None

# URLs associated with a project
class ProjectLinks(APIModel):
    github: HttpUrl | None = None
    linkedin: HttpUrl | None = None
    other: HttpUrl | None = None

# Create a new project record shown in portfolio
class ProjectCreate(APIModel):
    title: StrictStr
    short_desc: StrictStr | None = None
    long_desc: StrictStr | None = None
    tags: list[SafeTag] = []
    links: dict[str, HttpUrl] | None = None
    metrics: list[dict[str, str]] | None = None
    cover_image_file_id: int | None = None
    sort_order: int = 0

# Update an existing project record
class ProjectUpdate(APIModel):
    title: StrictStr | None = None
    short_desc: StrictStr | None = None
    long_desc: StrictStr | None = None
    tags: list[SafeTag] | None = None
    links: dict[str, HttpUrl] | None = None
    metrics: list[MetricItem] | None = None
    cover_file_id: int | None = None
    sort_order: int | None = None

# Project output as it is returned
class ProjectOut(IDModel, Timestamped):
    user_id: int
    title: str
    short_desc: str | None = None
    long_desc: str | None = None
    tags: list[str]
    links: dict[str, HttpUrl] | None = None
    metrics: list[MetricItem] | None = None
    cover_file_id: int | None = None
    sort_order: int