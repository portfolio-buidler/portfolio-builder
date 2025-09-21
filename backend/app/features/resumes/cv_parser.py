import re
from .jsonb_models import ResumeParsedJSON

# CV parsing logic
class CVParser:
    # Text cleaning and normalization
    @staticmethod
    def _clean_text(text: str) -> str:
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

# Main parsing logic 
    def parse(self, raw_text: str) -> ResumeParsedJSON:
        t = self._clean_text(raw_text)

        # Simple heuristic patterns (will evolve later)
        skills = None
        m = re.search(r"(?im)^\s*(skills|technologies|languages)\s*[:\-]\s*(.+)$", t)
        if m:
            skills = [s.strip() for s in re.split(r"[,\|]", m.group(2)) if s.strip()]

        summary = None
        m = re.search(r"(?is)(summary|about)\s*[:\-]?\s*(.+?)(?:\n\n|\Z)", t)
        if m:
            summary = m.group(2).strip()

        return ResumeParsedJSON(summary=summary, skills=skills, experiences=None, education=None)
