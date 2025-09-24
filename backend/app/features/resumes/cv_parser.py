from .jsonb_models import ResumeParsedJSON
from app.features.parsing.parser_core import ParserCore


class CVParser:
    """Compatibility wrapper delegating to the new modular ParserCore."""

    def __init__(self) -> None:
        self._core = ParserCore()

    def parse(self, raw_text: str) -> ResumeParsedJSON:
        return self._core.parse(raw_text)
