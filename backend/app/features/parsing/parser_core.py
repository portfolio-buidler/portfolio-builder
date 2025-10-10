from __future__ import annotations
from typing import Optional

from .normalizers import normalize_text, heal_urls
import regex as re
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

    # Detect a likely title near the top to use as fallback role for experience (e.g., 'Full Stack Developer')
    fallback_role: Optional[str] = None
    for ln in lines[:5]:
        t = ln.strip()
        if not t:
            continue
        # Short title-like line without email/phone/url
        if 3 <= len(t) <= 40 and not any(x in t.lower() for x in ("@","http","www","linkedin","github")):
            # Avoid picking the person's name (already parsed) or section aliases
            if t != (contacts.get("name") or "") and not any(t.lower().startswith(a) for a in ("summary","profile","about")):
                # Heuristic: contains a role keyword
                if re.search(r"\b(Developer|Engineer|Manager|Lead|Architect|Designer)\b", t, re.I):
                    fallback_role = t
                    break

    # Extract languages from LANGUAGES section if present
    languages = None
    lang_section = sections.get("military_service", "")
    if "LANGUAGES" in text.upper():
        # Find LANGUAGES section in lines
        lang_lines = [l for l in lines if l.strip().upper().startswith("LANGUAGES")]
        if lang_lines:
            idx = lines.index(lang_lines[0])
            lang_block = []
            for l in lines[idx+1:]:
                if not l.strip():
                    break
                lang_block.append(l.strip())
            # Split by comma
            languages = [x.strip() for x in ",".join(lang_block).split(",") if x.strip()]
    military_service = sections.get("military_service") or None
    if military_service:
        military_service = military_service.split("\n")[0].strip()
    parsed = {
        "name": contacts["name"],
        "email": contacts["email"],
        "phone": contacts["phone"],
        "linkedin": contacts["linkedin"],
        "github": contacts["github"],
        "about": (sections.get("about") or None),
        "skills": parse_skills(sections.get("skills", "")),
        "education": parse_education(sections.get("education", "")),
        "experience": _parse_experience(sections.get("experience", ""), fallback_role=fallback_role),
        "projects": _parse_projects(sections.get("projects", "")),
        "military_service": military_service,
        "languages": languages,
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
