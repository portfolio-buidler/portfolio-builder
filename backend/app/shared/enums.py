from enum import StrEnum

class QuestionType(StrEnum):
    text = "text"
    textarea = "textarea"
    number = "number"
    select = "select"
    multiselect = "multiselect"
    boolean = "boolean"
    date = "date"
    url = "url"

class FileKind(StrEnum):
    resume = "resume"
    avatar = "avatar"
    project_image_cover = "project_image_cover"

class PortfolioStatus(StrEnum):
    draft = "draft"
    built = "built"
    published = "published"


class ParseStatus(StrEnum):
    pending = "pending"
    parsing = "parsing"
    success = "success"
    failed = "failed"

class EmploymentType(StrEnum):
    full_time = "full_time"
    part_time = "part_time"
    contract = "contract"
    intern = "intern"
    other = "other"
