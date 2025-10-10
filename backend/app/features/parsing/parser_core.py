from __future__ import annotations
from typing import Optional

from .normalizers import normalize_text, heal_urls
from .sections import find_sections
from .contact import parse_contacts
from .skills import parse_skills
from .education import parse_education
from .experience import parse_experience as _parse_experience
from .projects import parse_projects as _parse_projects

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
