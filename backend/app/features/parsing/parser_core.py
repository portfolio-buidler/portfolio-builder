from typing import Optional, List, Tuple
import re
from .sections import (
    EXP_SECTION_RE, EDU_SECTION_RE, SKILLS_SECTION_RE, ABOUT_SECTION_RE, PROJECTS_SECTION_RE,
    DATE_RE, BULLET, section_slice
)
from .contact import extract_contacts, EMAIL_REGEX, PHONE_REGEX  # import patterns for fallback filtering
from .education import extract_education
from .skills import extract_skills

MAX_DESC_LEN = 280

# def extract_about(text: str) -> Optional[str]:
#     body = section_slice(text, ABOUT_SECTION_RE, [EXP_SECTION_RE, EDU_SECTION_RE, SKILLS_SECTION_RE])
#     if not body:
#         return None
#     para = body.strip().split("\n\n")[0]
#     return para[:1200].strip()

def extract_about(text: str) -> Optional[str]:
    """Return summary/about paragraph.
    1. If an explicit About/Summary header exists -> first paragraph under it.
    2. Else fallback: take first contiguous paragraph block (excluding name/contact lines) that appears
       before the Experience / Education / Skills / Projects sections.
    """
    body = section_slice(text, ABOUT_SECTION_RE, [EXP_SECTION_RE, EDU_SECTION_RE, SKILLS_SECTION_RE, PROJECTS_SECTION_RE])
    if body:
        return body.strip().split("\n\n")[0][:1200].strip() or None

    # Fallback region: slice from after first line (name/title) up to first major section heading
    section_heads = [EXP_SECTION_RE, EDU_SECTION_RE, SKILLS_SECTION_RE, PROJECTS_SECTION_RE]
    first_head_pos = len(text)
    for pat in section_heads:
        m = pat.search(text)
        if m and m.start() < first_head_pos:
            first_head_pos = m.start()
    preface = text[:first_head_pos]
    lines = [ln.strip() for ln in preface.splitlines()]
    if not lines:
        return None
    # Drop first line (likely name/title) and any contact-ish lines
    content_lines: list[str] = []
    for ln in lines[1:]:
        if not ln:
            # preserve paragraph breaks to limit about to first paragraph
            if content_lines and content_lines[-1] != "":
                content_lines.append("")
            continue
        if re.search(EMAIL_REGEX, ln) or re.search(PHONE_REGEX, ln) or re.search(r"(linkedin|github|https?://|www\.)", ln, re.I):
            continue
        # stop if this line itself is (erroneously) a heading-like token
        if (EXP_SECTION_RE.match(ln) or EDU_SECTION_RE.match(ln) or SKILLS_SECTION_RE.match(ln) or PROJECTS_SECTION_RE.match(ln)):
            break
        content_lines.append(ln)
    # Build first paragraph from accumulated lines until blank separator
    paragraph_tokens: list[str] = []
    for ln in content_lines:
        if ln == "":
            break
        paragraph_tokens.append(ln)
    if not paragraph_tokens:
        return None
    para = " ".join(paragraph_tokens)
    # Heuristic: skip if the paragraph looks like just a title or <= 10 words
    if len(para.split()) < 10:
        return None
    return para[:1200].strip()


def _split_experience_blocks(body: str) -> List[str]:
    parts = re.split(r"\n{2,}", body.strip())
    blocks, buf = [], []
    for p in parts:
        header_like = DATE_RE.search(p) or re.search(r"\b(Manager|Lead|Engineer|Developer|Director|Head|Product|Project)\b", p)
        if header_like and buf:
            blocks.append("\n".join(buf).strip())
            buf = []
        buf.append(p)
    if buf:
        blocks.append("\n".join(buf).strip())
    return [b for b in blocks if b]

TITLE_RE = re.compile(r"\b(Manager|Lead|Engineer|Developer|Director|Head|Product|Project|Founder|Owner)\b")

def _extract_header_company_role_dates(block: str) -> Tuple[Optional[str], List[str], Optional[str]]:
    first = block.strip().splitlines()[0]
    dates = None
    dm = DATE_RE.search(first)
    if dm:
        dates = dm.group(0)
        first = first.replace(dates, "").replace("–", "-").replace("—", "-").strip()
    role_guess = None
    companies: List[str] = []
    if "|" in first:
        parts = [s.strip() for s in first.split("|") if s.strip()]
        if parts:
            role_guess = parts[0] if TITLE_RE.search(parts[0]) else None
            companies = parts[1:]
    elif "," in first:
        a, b = [s.strip() for s in first.split(",", 1)]
        if TITLE_RE.search(a):
            role_guess = a
            companies = [b]
        elif TITLE_RE.search(b):
            role_guess = b
            companies = [a]
    elif TITLE_RE.search(first):
        role_guess = first
    return role_guess, companies, dates

def _extract_descriptions(block: str) -> List[str]:
    lines = block.splitlines()[1:] if len(block.splitlines()) > 1 else []
    bullets: List[str] = []
    for ln in lines:
        ln = ln.strip()
        if not ln:
            continue
        if re.match(r"^[•\-\–\*]\s+", ln):
            bullets.append(re.sub(r"^[•\-\–\*]\s+", "", ln).strip())
        elif len(ln) >= 5:
            bullets.append(ln)
    cleaned = []
    for b in bullets:
        b = b.strip(" .;")
        if len(b) > MAX_DESC_LEN:
            # take first sentence-ish
            sent = re.split(r"(?<=[.!?])\s", b)[0]
            cleaned.append(sent[:MAX_DESC_LEN])
        else:
            cleaned.append(b)
    return cleaned[:6]

def extract_experience(text: str) -> List[dict]:
    exp_body = section_slice(text, EXP_SECTION_RE, [EDU_SECTION_RE, SKILLS_SECTION_RE, ABOUT_SECTION_RE, PROJECTS_SECTION_RE])
    proj_body = section_slice(text, PROJECTS_SECTION_RE, [EDU_SECTION_RE, SKILLS_SECTION_RE, ABOUT_SECTION_RE])
    bodies = []
    if exp_body:
        bodies.append(exp_body)
    if proj_body:
        bodies.append(proj_body)
    if not bodies:
        return []
    items: List[dict] = []
    for body in bodies:
        for b in _split_experience_blocks(body):
            role, companies, dates = _extract_header_company_role_dates(b)
            descs = _extract_descriptions(b)
            if not descs and len(b.splitlines()) == 1:
                # treat single line project title as description
                descs = [b.strip()]
            items.append({
                "role": role,
                "companies": companies,
                "dates": dates,
                "descriptions": descs,
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
