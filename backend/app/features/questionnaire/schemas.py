from datetime import datetime
from typing import Any
from typing_extensions import Annotated
from pydantic import Field, StrictStr, constr
from app.shared.schemas import APIModel, IDModel, Timestamped
from app.shared.enums import QuestionType

Name = Annotated[str, constr(min_length=1, max_length=30)]
Description = Annotated[str, constr(max_length=500)]

# Create a new questionnaire container for dynamic forms
class QuestionnaireCreate(APIModel):
    name: Name
    description: Description | None = None
    is_active: bool = True

# Questionnaire output as it is returned
class QuestionnaireOut(IDModel, Timestamped):
    name: Name
    description: Description | None = None
    is_active: bool

# Options for questions that have selectable choices
class QuestionOptions(APIModel):
    choices: list[StrictStr]  | None = None  
    allow_multiple: bool = False

# Creating a new question linked to a questionnaire
class QuestionCreate(APIModel):
    questionnaire_id: int
    prompt: str
    qtype: QuestionType
    options: QuestionOptions | None
    is_required: bool = False
    sort_order: int = 0

# Single question entry
class QuestionOut(IDModel, APIModel):
    questionnaire_id: int
    prompt: str
    qtype: QuestionType
    options: QuestionOptions | None
    is_required: bool
    sort_order: int

# Creating a new response to a questionnaire
class ResponseCreate(APIModel):
    questionnaire_id: int
    user_id: int
    submitted_at: datetime

# Single response entry
class ResponseOut(IDModel, APIModel):
    questionnaire_id: int
    user_id: int
    submitted_at: datetime

# Flexible answer value types
AnswerScalar = str | int | float | bool
AnswerMap    = dict[str, AnswerScalar | list[AnswerScalar]]
AnswerValue  = AnswerScalar | list[AnswerScalar] | AnswerMap

# Creating a new answer linked to a response and question
class AnswerCreate(APIModel):
    response_id: int
    question_id: int
    value: AnswerValue

# Single answer entry
class AnswerOut(IDModel, APIModel):
    response_id: int
    question_id: int
    value: AnswerValue
