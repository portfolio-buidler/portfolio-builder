import re
from app.features.resumes.jsonb_models import EducationEntry

_YEAR_PAT = re.compile(
    r"\b(19\d{2}|20\d{2})(?:\s*[–\-]\s*(19\d{2}|20\d{2}))?\b"
)
_DEGREE_PHRASE_PAT = re.compile(
    r"\b((?:Bachelor(?:’s|'s)?\s+Degree|Master(?:’s|'s)?\s+Degree|PhD|Doctorate|Diploma|Associate)"
    r"(?:\s+in\s+[A-Z][^,;]{1,80})?)",
    re.IGNORECASE,
)
_DEGREE_FIELD_PAREN_PAT = re.compile(
    r"\b([A-Z][A-Za-z&\s]{2,80}\(\s*(?:B\.Sc|M\.Sc|MBA|PhD|Doctorate|Diploma|Associate)\.?\s*\))",
    re.IGNORECASE,
)
_DEGREE_PAT = re.compile(
    r"\b(B\.?\s?(?:Sc|A)|Bachelor(?:'s)?|M\.?\s?(?:Sc|A)|"
    r"Master(?:'s)?|PhD|Doctorate|Diploma|Associate)\b",
    re.IGNORECASE,
)
_INSTITUTION_HINT_PAT = re.compile(
    r"\b(University|College|Institute|Polytechnic|Academy|School)\b",
    re.IGNORECASE,
)
_COURSEWORK_SKIP = re.compile(
    r"\b(coursework|courses|relevant\s+coursework)\b", re.IGNORECASE
)


def _split_lines(text: str) -> list[str]:
    return [ln.strip() for ln in text.split("\n") if ln.strip()]


def _clean_institution(text: str) -> str:
    """Remove trailing years (e.g., '2021 - 2025') from institution names."""
    return re.sub(r'\s*\(?\b\d{4}(?:\s*[-–]\s*\d{4})?\)?$', '', text).strip(" ,.;-")


def parse_education_entries(sections: dict[str, str]) -> list[EducationEntry] | None:
    edu = sections.get("EDUCATION")
    if not edu:
        return None

    lines = _split_lines(edu)
    entries: list[EducationEntry] = []

    for ln in lines:
        ln = ln.strip()
        if not ln:
            continue
        # Skip coursework or lines that are clearly not degrees
        if _COURSEWORK_SKIP.search(ln) or ln.lower().startswith(("completed", "led", "developed", "tools", "technologies")):
            continue

        # Extract year
        year_match = _YEAR_PAT.search(ln)
        year = year_match.group(0) if year_match else None

        # Remove year from line to simplify parsing
        ln_clean = ln
        if year:
            ln_clean = ln_clean.replace(year, "").strip()

        # Split degree vs institution (only first comma or pipe)
        parts = re.split(r",|\|", ln_clean, maxsplit=1)
        degree_candidate = parts[0].strip() if parts else None
        degree = re.sub(r"\s+", " ", degree_candidate).strip(" ,.;") if degree_candidate else None

        # Institution: take second part if exists
        institution = None
        if len(parts) > 1:
            institution_candidate = parts[1].strip()

            # Remove everything starting from '(' (year or extra info)
            institution_candidate = re.split(r"\(", institution_candidate, maxsplit=1)[0].strip()
            # Remove empty parentheses and trailing dashes
            institution_candidate = re.sub(r"\(\s*\)", "", institution_candidate).strip()

            if institution_candidate:
                institution = institution_candidate

        if degree:  # only add if degree exists
            entries.append(EducationEntry(degree=degree, institution=institution, year=year))
            break  # <-- stop after the first real degree entry

    return entries or None
