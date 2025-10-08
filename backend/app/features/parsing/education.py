import re
from .sections import EDU_SECTION_RE, EXP_SECTION_RE, SKILLS_SECTION_RE, ABOUT_SECTION_RE, BULLET

DEGREE_WORDS = r"(B\.?A\.?|B\.?Sc\.?|BSc|BA|M\.?A\.?|M\.?Sc\.?|MSc|MA|MBA|LLB|LL\.B\.|Ph\.?D\.?|Bachelor.?s|Master.?s|Doctorate|Diploma|Associate|Certificate)"

def extract_education(text: str) -> list[dict]:
    stop = [EXP_SECTION_RE, SKILLS_SECTION_RE, ABOUT_SECTION_RE]
    body = _slice(text, EDU_SECTION_RE, stop) or text

    lines = [ln.strip() for ln in body.splitlines() if ln.strip()]
    items: list[dict] = []

    for ln in lines:
        if not re.search(DEGREE_WORDS, ln, re.I):
            continue
        year = _first_year(ln)
        degree, institution = _split_degree_institution(ln)
        items.append({"degree": degree, "institution": institution, "year": year})

    if not items:
        for b in re.split(BULLET, body):
            b = b.strip()
            if b and re.search(DEGREE_WORDS, b, re.I):
                items.append({
                    "degree": re.search(rf"{DEGREE_WORDS}.*", b, re.I).group(0) if re.search(rf"{DEGREE_WORDS}", b, re.I) else None,
                    "institution": None,
                    "year": _first_year(b),
                })
    return items[:8]

def _first_year(s: str) -> str | None:
    m = re.search(r"(19|20)\d{2}", s)
    return m.group(0) if m else None

def _split_degree_institution(ln: str) -> tuple[str | None, str | None]:
    ln = re.sub(r"\(\s*(19|20)\d{2}\s*(?:[-–]\s*(19|20)\d{2})?\s*\)", "", ln)  # drop parenthesized years
    if "," in ln or "|" in ln:
        a, b = re.split(r",|\|", ln, maxsplit=1)
        a, b = a.strip(), b.strip()
        if re.search(DEGREE_WORDS, a, re.I):
            return a, _clean_tail(b)
        return (re.search(rf"{DEGREE_WORDS}.*", b, re.I).group(0) if re.search(DEGREE_WORDS, b, re.I) else None, _clean_tail(a))
    m = re.search(rf"({DEGREE_WORDS}).*?\s+(?:at|@)\s+(.+)", ln, re.I)
    if m:
        return m.group(0), _clean_tail(m.group(2))
    degree = re.search(rf"{DEGREE_WORDS}.*", ln, re.I)
    return (degree.group(0).strip() if degree else None, None)

def _clean_tail(s: str) -> str:
    return re.sub(r"\s*\(?\b\d{4}(?:\s*[-–]\s*\d{4})?\)?$", "", s).strip(" ,.;-")

def _slice(text, head, stops):
    m = head.search(text)
    if not m:
        return None
    start = m.end()
    ends = [r.search(text, start) for r in stops]
    ends = [e for e in ends if e]
    end = min([e.start() for e in ends], default=len(text))
    return text[start:end].strip() or None
