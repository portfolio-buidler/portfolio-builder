# shared Enums (parse_status, portfolio_status, etc.)
from enum import StrEnum

# Enum for question types in the questionnaire
class QuestionType(StrEnum):
    text = "text"
    textarea = "textarea"
    number = "number"
    select = "select"
    multiselect = "multiselect"
    boolean = "boolean"
    date = "date"
    url = "url"
    
#file categories we support for upload
class FileKind(StrEnum):
    resume = "resume"
    avatar = "avatar"
    project_image_cover = "project_image_cover"

# Portfolio status 
class PortfolioStatus(StrEnum):
    draft = "draft"
    built = "built"
    published = "published"

# Resume parsing pipeline status
class ParseStatus(StrEnum):
    pending = "pending"
    parsed = "parsed"
    failed = "failed"

# Employment classification for experience entries
class EmploymentType(StrEnum):
    full_time = "full_time"
    part_time = "part_time"
    contract = "contract"
    intern = "intern"
    other = "other"