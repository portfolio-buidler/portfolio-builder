from __future__ import annotations
from dataclasses import dataclass, asdict
from typing import Optional, List, Dict
import regex as re

@dataclass
class ProjectItem:
    project_name: Optional[str] = None
    description: Optional[str] = None

_BULLET_RE = re.compile(r"^[•\-–—]")
_MAX_TITLE_LEN = 200

_VERB_START = re.compile(r"^(Led|Managed|Implemented|Coordinating|Building|Developed|Driving|Driving|Improved|Created|Designed|Orchestrated)\b", re.I)

def _is_probable_title(s: str) -> bool:
    # Titles are typically short and noun-phrasy
    if len(s) > 120:
        return False
    if s.endswith('.'):
        return False
    words = s.split()
    if len(words) > 12 or len(words) < 1:
        return False
    if _VERB_START.match(s):
        return False
    # Require Title Case or ALL CAPS start (first char uppercase)
    if not s[:1].isupper():
        return False
    return True

def parse_projects(section_text: str) -> List[Dict]:
    if not section_text:
        return []
    lines = [l.strip() for l in section_text.splitlines() if l.strip()]
    items: List[ProjectItem] = []
    current_name: Optional[str] = None
    description_lines: list[str] = []
    for ln in lines:
        if _BULLET_RE.match(ln):
            desc = re.sub(r"^[•\-–—]\s*", "", ln)
            if current_name:
                description_lines.append(desc)
            continue
        # Filter out stray 'Action:', 'Result:', 'View Project' as separate projects
        if ln.strip().lower() in {"action:", "result:", "view project"}:
            continue
        # Non-bullet line: decide if it's a title or a description continuation
        if current_name:
            if _is_probable_title(ln):
                items.append(ProjectItem(
                    project_name=current_name.strip(":-• | "),
                    description=(" ".join(description_lines).strip() or None),
                ))
                description_lines = []
                current_name = ln.rstrip("|").strip()
            else:
                description_lines.append(ln)
        else:
            if _is_probable_title(ln):
                current_name = ln.rstrip("|").strip()
            else:
                # Join consecutive description lines until next probable title
                if items:
                    description_lines.append(ln)
                continue
    if current_name:
        items.append(ProjectItem(
            project_name=current_name.strip(":-• | "),
            description=(" ".join(description_lines).strip() or None),
        ))
    out: List[Dict] = []
    for item in items:
        if not item.project_name and not item.description:
            continue
        name = item.project_name or ""
        if len(name) > _MAX_TITLE_LEN:
            # Truncate to avoid validation errors
            name = name[: _MAX_TITLE_LEN].rstrip() + "…"
        out.append({"project_name": name or None, "description": item.description})
    return out
