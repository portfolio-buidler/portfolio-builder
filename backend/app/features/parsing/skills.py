import re
from .sections import SKILLS_SECTION_RE, EXP_SECTION_RE, EDU_SECTION_RE, ABOUT_SECTION_RE, BULLET
from .normalizers import dedup_ordered

def extract_skills(text: str) -> list[str]:
    stop = [EXP_SECTION_RE, EDU_SECTION_RE, ABOUT_SECTION_RE]
    body = _slice(text, SKILLS_SECTION_RE, stop)
    if not body:
        # inline line like "Technical Skills: React, TS, ..."
        m = re.search(r"(?im)^\s*(skills|technical skills|technologies|tools|tech stack|stack)[:\-]\s*(.+)$", text)
        if m:
            body = m.group(2)
        else:
            return []
    items = re.split(BULLET + r"|\s*[,\|;/]\s*", body)
    skills = []
    for it in items:
        it = it.strip("•-–·* \n\t;()")
        if not it:
            continue
        it = re.sub(r"^(skills|tools|technologies|tech\s*stack)\s*:\s*", "", it, flags=re.I).strip()
        if 2 <= len(it) <= 48:
            skills.append(it)
    return dedup_ordered(skills)[:100]

def _slice(text: str, head, stops):
    m = head.search(text)
    if not m:
        return None
    start = m.end()
    ends = [r.search(text, start) for r in stops]
    ends = [e for e in ends if e]
    end = min([e.start() for e in ends], default=len(text))
    return text[start:end].strip() or None
