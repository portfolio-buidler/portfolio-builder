import re

# Header synonyms. Humans love reinventing headings.
EDU_SECTION_RE = re.compile(r"(education|studies|academic background)[:\s]*", re.I)
EXP_SECTION_RE = re.compile(r"(experience|work experience|professional experience|employment history)[:\s]*", re.I)
PROJECTS_SECTION_RE = re.compile(r"(projects|selected projects|personal projects)[:\s]*", re.I)
ABOUT_SECTION_RE = re.compile(r"(summary|objective|about|profile)[:\s]*", re.I)
SKILLS_SECTION_RE = re.compile(r"(skills|technical skills|technologies|tools|tech stack|stack|tools & technologies)[:\s]*", re.I)

# Dates like "2021 – 2025" or "May 2020 – Present"
DATE_RE = re.compile(
    r"((Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|"
    r"Sep(?:t\.?|tember)|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\s*[–-]\s*(Present|\d{4})|\d{4}\s*[–-]\s*(Present|\d{4}))",
    re.I,
)

BULLET = r"(?:^|\n)[\s•\-–·\*]\s+"

def section_slice(text: str, head_re: re.Pattern, stop_res: list[re.Pattern]) -> str | None:
    m = head_re.search(text)
    if not m:
        return None
    start = m.end()
    stops = [r.search(text, start) for r in stop_res]
    stops = [s for s in stops if s]
    end = min([s.start() for s in stops], default=len(text))
    body = text[start:end].strip()
    return body or None
