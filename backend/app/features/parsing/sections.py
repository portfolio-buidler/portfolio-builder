from __future__ import annotations
from typing import Tuple, Dict, List
import regex as re

SECTION_ALIASES = {
    "about": ["summary", "profile", "about"],
    "skills": ["skills", "technical skills", "tech stack"],
    "education": ["education", "studies", "academic"],
    "experience": ["experience", "work", "professional experience", "employment"],
    "projects": ["projects", "portfolio", "selected projects"],
    "military_service": ["military", "idf", "service", "naval", "army", "air force", "unit"],
}

def find_sections(text: str) -> Tuple[Dict[str, str], List[str]]:
    lines = [l.rstrip() for l in text.splitlines()]
    idxs: list[tuple[int, str]] = []
    for i, ln in enumerate(lines):
        low = ln.strip().lower().strip(":")
        for key, aliases in SECTION_ALIASES.items():
            if any(low.startswith(a) for a in aliases):
                idxs.append((i, key))
    idxs.sort()
    sections = {k: "" for k in SECTION_ALIASES}
    for n, (i, key) in enumerate(idxs):
        j = idxs[n+1][0] if n+1 < len(idxs) else len(lines)
        sections[key] = "\n".join(lines[i+1:j]).strip()
    return sections, lines
