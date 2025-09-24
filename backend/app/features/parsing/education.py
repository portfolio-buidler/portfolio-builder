import re
from app.features.resumes.jsonb_models import EducationEntry

_YEAR_PAT = re.compile(r"\b(19\d{2}|20\d{2})(?:\s*[–\-]\s*(19\d{2}|20\d{2}))?\b")
_DEGREE_PHRASE_PAT = re.compile(
    r"\b((?:B\.?\s?(?:Sc|A)|Bachelor(?:'s)?|M\.?\s?(?:Sc|A)|Master(?:'s)?|PhD|Doctorate|Diploma|Associate)\.?(?:\s+(?:in|of)\s+[^\n\|,;]{1,80})?)",
    re.IGNORECASE,
)
_DEGREE_PAT = re.compile(r"\b(B\.?\s?(?:Sc|A)|Bachelor(?:'s)?|M\.?\s?(?:Sc|A)|Master(?:'s)?|PhD|Doctorate|Diploma|Associate)\b", re.IGNORECASE)
_INSTITUTION_HINT_PAT = re.compile(r"\b(University|College|Institute|Polytechnic|Academy|School)\b", re.IGNORECASE)
_COURSEWORK_SKIP = re.compile(r"\b(coursework|courses|relevant\s+coursework)\b", re.IGNORECASE)

def _split_lines(text: str) -> list[str]:
    return [ln.strip() for ln in text.split("\n") if ln.strip()]

def parse_education_entries(sections: dict[str, str]) -> list[EducationEntry] | None:
    edu = sections.get("EDUCATION")
    if not edu:
        return None
    lines = _split_lines(edu)
    entries: list[EducationEntry] = []
    for ln in lines:
        if _COURSEWORK_SKIP.search(ln) or ln.strip().lower().startswith("completed"):
            continue
        year_match = _YEAR_PAT.search(ln)
        year = year_match.group(0) if year_match else None

        degree = None
        deg_m = _DEGREE_PHRASE_PAT.search(ln) or _DEGREE_PAT.search(ln)
        if deg_m:
            degree = re.sub(r"\s+", " ", deg_m.group(1)).strip(" .")

        institution = None
        if "|" in ln:
            institution_block = ln.split("|", 1)[1].strip()
            if _YEAR_PAT.search(institution_block):
                institution_block = _YEAR_PAT.sub("", institution_block).strip(" ,;.-")
            if institution_block:
                institution = institution_block
        cand_parts = re.split(r"[,\-\u2013;]|\s\|\s", ln)
        cand_parts = [p.strip() for p in cand_parts if p.strip()]
        if not institution:
            for part in cand_parts:
                if _INSTITUTION_HINT_PAT.search(part):
                    institution = part
                    break
        if not institution:
            if degree:
                caps = re.findall(r"\b([A-Z][A-Za-z&.'’\-]*(?:\s+[A-Z][A-Za-z&.'’\-]*)*)\b", ln)
                for c in caps:
                    if c.lower().startswith("completed"):
                        continue
                    if not degree or c.lower() not in degree.lower():
                        if 2 <= len(c) <= 120:
                            institution = c
                            break
        if degree or institution:
            entries.append(EducationEntry(degree=degree, institution=institution, year=year))
    return entries or None
