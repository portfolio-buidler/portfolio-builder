from typing import Optional, List, Tuple
import re
from .sections import (
    EXP_SECTION_RE, EDU_SECTION_RE, SKILLS_SECTION_RE, ABOUT_SECTION_RE, PROJECTS_SECTION_RE,
    DATE_RE, BULLET, section_slice
)
from .contact import extract_contacts
from .education import extract_education
from .skills import extract_skills

def extract_about(text: str) -> Optional[str]:
    body = section_slice(text, ABOUT_SECTION_RE, [EXP_SECTION_RE, EDU_SECTION_RE, SKILLS_SECTION_RE])
    if not body:
        return None
    para = body.strip().split("\n\n")[0]
    return para[:1200].strip()

def _split_experience_blocks(body: str) -> List[str]:
    parts = re.split(r"\n{2,}", body.strip())
    blocks, buf = [], []
    for p in parts:
        if DATE_RE.search(p) or re.search(r"\bManager|Lead|Engineer|Developer|Director|Head|Product|Project\b", p, re.I):
            if buf:
                blocks.append("\n".join(buf).strip())
                buf = []
        buf.append(p)
    if buf:
        blocks.append("\n".join(buf).strip())
    return [b for b in blocks if b]

def _extract_header_company_role_dates(block: str) -> Tuple[Optional[str], List[str], Optional[str]]:
    first = block.strip().splitlines()[0]
    dates = None
    dm = DATE_RE.search(first) or DATE_RE.search(block.splitlines()[0])
    if dm:
        dates = dm.group(0)
        first = first.replace(dates, "").replace("–", "").replace("-", "").strip()
    if "|" in first:
        parts = [s.strip() for s in first.split("|") if s.strip()]
        role_guess, company_candidates = parts[0], parts[1:]
    elif "," in first:
        a, b = [s.strip() for s in first.split(",", 1)]
        if re.search(r"\b(Project|Product|Manager|Lead|Engineer|Developer|Director|Head)\b", a, re.I):
            role_guess, company_candidates = a, [b]
        else:
            role_guess, company_candidates = b, [a]
    else:
        role_guess, company_candidates = first, []
    companies = [re.sub(r"^(at|@)\s+", "", c, flags=re.I) for c in company_candidates if c]
    return (role_guess or None), companies, (dates or None)

def _extract_descriptions(block: str) -> List[str]:
    lines = block.splitlines()[1:] if len(block.splitlines()) > 1 else []
    bullets = []
    for ln in lines:
        ln = ln.strip()
        if not ln:
            continue
        if re.match(r"^[•\-\–\*]\s+", ln):
            bullets.append(re.sub(r"^[•\-\–\*]\s+", "", ln).strip())
        elif len(ln) >= 5:
            bullets.append(ln)
    return [b.strip(" .;") for b in bullets if b.strip(" .;")][:20]

def extract_experience(text: str) -> List[dict]:
    body = section_slice(text, EXP_SECTION_RE, [EDU_SECTION_RE, SKILLS_SECTION_RE, ABOUT_SECTION_RE])
    if not body:
        body = section_slice(text, PROJECTS_SECTION_RE, [EDU_SECTION_RE, SKILLS_SECTION_RE, ABOUT_SECTION_RE])
    if not body:
        return []
    items: List[dict] = []
    for b in _split_experience_blocks(body):
        role, companies, dates = _extract_header_company_role_dates(b)
        items.append({
            "role": role or None,
            "companies": companies or [],
            "dates": dates or None,
            "descriptions": _extract_descriptions(b) or [],
        })
    return items[:12]

def parse_all_from_text(text: str) -> dict:
    name, phone, email = extract_contacts(text)
    return {
        "name": name,
        "phone": phone,
        "email": str(email) if email else None,
        "about": extract_about(text),
        "full_text": text,
        "skills": extract_skills(text),
        "education": extract_education(text),
        "experience": extract_experience(text),
    }
