from __future__ import annotations
from dataclasses import dataclass, asdict
from typing import Optional, List, Dict
import regex as re

@dataclass
class ProjectItem:
    project_name: Optional[str] = None
    description: Optional[str] = None

_BULLET_RE = re.compile(r"^[•\-–—]")

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
        if current_name:
            items.append(ProjectItem(
                project_name=current_name.strip(":-• "),
                description=(" ".join(description_lines).strip() or None),
            ))
            description_lines = []
        current_name = ln
    if current_name:
        items.append(ProjectItem(
            project_name=current_name.strip(":-• "),
            description=(" ".join(description_lines).strip() or None),
        ))
    out: List[Dict] = []
    for item in items:
        if not item.project_name and not item.description:
            continue
        out.append(asdict(item))
    return out
