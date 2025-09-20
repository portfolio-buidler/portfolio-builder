import re
from .jsonb_models import ResumeParsedJSON

class CVParser:
    @staticmethod
    def _clean_text(text: str) -> str:
        # שמירה על ירידות שורה, צמצום רווחים, הסרת תווים בעייתיים
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        text = re.sub(r"[ \t]+", " ", text)           # לא למעוך \n
        text = re.sub(r"\n{3,}", "\n\n", text)        # לא יותר משתי ירידות שורה רצופות
        return text.strip()

    def parse(self, raw_text: str) -> ResumeParsedJSON:
        t = self._clean_text(raw_text)

        # היגדים פשוטים ל-MVP; בהמשך תשופר לוגיקה/LLM
        skills = None
        m = re.search(r"(?im)^\s*(skills|טכנולוגיות)\s*[:\-]\s*(.+)$", t)
        if m:
            skills = [s.strip() for s in re.split(r"[,\|]", m.group(2)) if s.strip()]

        summary = None
        m = re.search(r"(?is)(summary|about|אודות)\s*[:\-]?\s*(.+?)(?:\n\n|\Z)", t)
        if m:
            summary = m.group(2).strip()

        return ResumeParsedJSON(
            summary=summary,
            skills=skills,
            experiences=None,
            education=None
        )
