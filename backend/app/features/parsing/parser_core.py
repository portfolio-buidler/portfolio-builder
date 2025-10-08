from __future__ import annotations
from dataclasses import dataclass, asdict
from typing import Optional
import regex as re

from .normalizers import normalize_text, heal_urls
from .sections import find_sections
from .contact import parse_contacts
from .skills import parse_skills
from .education import parse_education

YEAR_RANGE_RE = re.compile(r"(?:(?:20|19)\d{2})(?:\s*[–-]\s*(?:Present|(?:20|19)\d{2}))?", re.I)

@dataclass
class ExperienceItem:
    role: Optional[str] = None
    company: Optional[str] = None
    dates: Optional[str] = None
    description: Optional[str] = None

@dataclass
class ProjectItem:
    project_name: Optional[str] = None
    description: Optional[str] = None

def _split_blocks(text: str) -> list[str]:
    return [b.strip() for b in re.split(r"\n{2,}", text) if b.strip()]

def _parse_experience(s: str) -> list[dict]:
    if not s:
        return []
    items: list[ExperienceItem] = []
    for b in _split_blocks(s):
        lines = [l for l in b.splitlines() if l.strip()]
        head = lines[0] if lines else ""
        dates = YEAR_RANGE_RE.search(b)
        role, company = None, None
        if "—" in head:
            role, company = [x.strip() or None for x in head.split("—", 1)]
        elif "-" in head:
            role, company = [x.strip() or None for x in head.split("-", 1)]
        desc = "\n".join(lines[1:]).strip() or None
        if not any([role, company, desc]):
            continue
        items.append(
            ExperienceItem(role=role, company=company, dates=dates.group(0) if dates else None, description=desc)
        )
    return [asdict(x) for x in items]

def _parse_projects(s: str) -> list[dict]:
    if not s:
        return []
    items: list[ProjectItem] = []
    for b in _split_blocks(s):
        lines = [l for l in b.splitlines() if l.strip()]
        if not lines:
            continue
        title = lines[0].strip(":-• ")
        desc = " ".join(lines[1:]).strip() or None
        items.append(ProjectItem(project_name=title, description=desc))
    return [asdict(x) for x in items]

def parse_cv_text(raw_text: str) -> dict:
    text = heal_urls(normalize_text(raw_text))
    sections, lines = find_sections(text)
    contacts = parse_contacts(lines)

    parsed = {
        "name": contacts["name"],
        "email": contacts["email"],
        "phone": contacts["phone"],
        "linkedin": contacts["linkedin"],
        "github": contacts["github"],
        "about": (sections.get("about") or None),
        "skills": parse_skills(sections.get("skills", "")),
        "education": parse_education(sections.get("education", "")),
        "experience": _parse_experience(sections.get("experience", "")),
        "projects": _parse_projects(sections.get("projects", "")),
        "military_service": (sections.get("military_service") or None),
    }

    return {
        "full_text": text,
        "parsed": parsed,
        "meta": {
            "source_file": None,
            "mime": None,
            "pages": None,
            "parse_status": "success",
            "errors": []
        }
    }
