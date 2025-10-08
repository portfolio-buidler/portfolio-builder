from __future__ import annotations
from dataclasses import dataclass, asdict
from typing import Optional, List, Dict
import regex as re

YEAR_RANGE_RE = re.compile(r"(?:(?:20|19)\d{2})(?:\s*[–-]\s*(?:Present|(?:20|19)\d{2}))?", re.I)

@dataclass
class ExperienceItem:
    role: Optional[str] = None
    company: Optional[str] = None
    dates: Optional[str] = None
    description: Optional[str] = None

_HEADER_DELIMS = ["—", "–", "|", " - ", "-"]

def parse_experience(section_text: str) -> List[Dict]:
    if not section_text:
        return []
    lines = [l.strip() for l in section_text.splitlines() if l.strip()]
    items: List[ExperienceItem] = []
    current_role: Optional[str] = None
    current_company: Optional[str] = None
    current_dates: Optional[str] = None
    description_lines: list[str] = []

    for ln in lines:
        has_delim = any(d in ln for d in _HEADER_DELIMS)
        has_year = bool(YEAR_RANGE_RE.search(ln))
        if has_delim or has_year:
            if current_role or current_company or description_lines:
                items.append(ExperienceItem(
                    role=current_role,
                    company=current_company,
                    dates=current_dates,
                    description=("\n".join(description_lines).strip() or None),
                ))
                description_lines = []
            header_line = ln
            date_match = YEAR_RANGE_RE.search(header_line)
            current_dates = date_match.group(0) if date_match else None
            header_no_date = header_line.replace(date_match.group(0), "").strip() if date_match else header_line
            role, company = None, None
            for delim in _HEADER_DELIMS:
                if delim in header_no_date:
                    parts = header_no_date.split(delim, 1)
                    role = parts[0].strip() or None
                    company = parts[1].strip() or None
                    break
            if role is None and company is None:
                role = header_no_date
            current_role = role
            current_company = company
        else:
            description_lines.append(ln)

    if current_role or current_company or description_lines:
        items.append(ExperienceItem(
            role=current_role,
            company=current_company,
            dates=current_dates,
            description=("\n".join(description_lines).strip() or None),
        ))

    out: List[Dict] = []
    for item in items:
        if not item.role and not item.company and not item.description:
            continue
        out.append(asdict(item))
    return out
