from __future__ import annotations
from dataclasses import dataclass, asdict
from typing import Optional, List, Dict
import regex as re

YEAR_RANGE_RE = re.compile(r"(?:(?:20|19)\d{2})(?:\s*[–-]\s*(?:Present|(?:20|19)\d{2}))?", re.I)
# Variant A: dates in parentheses
HEADER_RE_A = re.compile(
    r"^(?P<role>.+?)\s+[–—-]\s+(?P<company>[^()]+?)\s*\((?P<dates>(?:(?:20|19)\d{2})(?:\s*[–-]\s*(?:Present|(?:20|19)\d{2}))?)\)\s*(?P<tail>.*)$",
    re.I,
)
# Variant B: dates without parentheses, possibly glued by dash
HEADER_RE_B = re.compile(
    r"^(?P<role>.+?)\s+[–—-]\s+(?P<company>.+?)\s*(?P<dates>(?:(?:20|19)\d{2})\s*[–-]\s*(?:Present|(?:20|19)\d{2}))\s*(?P<tail>.*)$",
    re.I,
)

@dataclass
class ExperienceItem:
    role: Optional[str] = None
    company: Optional[str] = None
    dates: Optional[str] = None
    description: Optional[str] = None

_HEADER_DELIMS = [" — ", " – ", " | ", " - "]

def _prejoin_broken_headers(lines: List[str]) -> List[str]:
    out: List[str] = []
    i = 0
    # Patterns for broken date ranges across lines
    open_paren_year_dash = re.compile(r"\(\s*(?:20|19)\d{2}\s*[–-]?\s*$")
    year_dash_end = re.compile(r"(?:20|19)\d{2}\s*[–-]\s*$")
    next_year_close = re.compile(r"^\s*(?:Present|(?:20|19)\d{2})\s*\)?\s*$", re.I)
    while i < len(lines):
        ln = lines[i]
        if i + 1 < len(lines):
            nx = lines[i + 1]
            if open_paren_year_dash.search(ln) and next_year_close.search(nx):
                out.append((ln.rstrip() + " " + nx.lstrip()).strip())
                i += 2
                continue
            if year_dash_end.search(ln) and next_year_close.search(nx):
                out.append((ln.rstrip() + nx.lstrip()).strip())
                i += 2
                continue
        out.append(ln)
        i += 1
    return out

def parse_experience(section_text: str) -> List[Dict]:
    if not section_text:
        return []
    raw_lines = [l.rstrip() for l in section_text.splitlines()]
    stitched = _prejoin_broken_headers(raw_lines)
    lines = [l.strip() for l in stitched if l.strip()]
    items: List[ExperienceItem] = []
    current_role: Optional[str] = None
    current_company: Optional[str] = None
    current_dates: Optional[str] = None
    description_lines: list[str] = []

    for ln in lines:
        # First, try an explicit header match capturing role/company/dates/tail
        m = HEADER_RE_A.match(ln) or HEADER_RE_B.match(ln)
        if m:
            # Flush previous item
            if current_role or current_company or description_lines:
                items.append(ExperienceItem(
                    role=current_role,
                    company=current_company,
                    dates=current_dates,
                    description=("\n".join(description_lines).strip() or None),
                ))
                description_lines = []

            role_captured = (m.group("role") or "").strip(" ,|")
            comp = (m.group("company") or "").strip()
            comp = re.sub(r",\s*$", "", comp)
            # If company contains a comma, treat the last segment as company and prepend the prior part to role with a dash
            if "," in comp:
                last_comma = comp.rfind(",")
                role_suffix = comp[:last_comma].strip()
                company_only = comp[last_comma + 1 :].strip()
                current_role = (f"{role_captured} – {role_suffix}").strip(" -|") or None
                current_company = (company_only or None)
            else:
                current_role = role_captured or None
                current_company = comp or None
            current_dates = (m.group("dates") or "").strip() or None
            tail = (m.group("tail") or "").strip()
            if tail:
                description_lines.append(tail)
            continue

        # Fallback header path: require a year range AND a header delimiter on the same line
        date_match = YEAR_RANGE_RE.search(ln)
        has_delim = any(d in ln for d in _HEADER_DELIMS)
        if date_match and has_delim:
            # Flush previous item
            if current_role or current_company or description_lines:
                items.append(ExperienceItem(
                    role=current_role,
                    company=current_company,
                    dates=current_dates,
                    description=("\n".join(description_lines).strip() or None),
                ))
                description_lines = []

            # Parse header
            header_line = ln
            current_dates = date_match.group(0) if date_match else None
            # Tail description after the date (if inline)
            tail_desc = None
            header_for_split = header_line
            tail_desc = header_line[date_match.end():].lstrip(" )-–—|").strip() or None
            # Use only the part BEFORE the date to split role/company
            header_for_split = header_line[: date_match.start()].rstrip()
            # Remove the date (and any wrapping parentheses) from header remainder just in case
            header_no_date = re.sub(r"\s*\([^)]*\)\s*", " ", header_for_split).strip()

            # Find first delimiter occurrence and split role/company part
            role, company = None, None
            used_delim = None
            delim_idx = -1
            for delim in _HEADER_DELIMS:
                idx = header_no_date.find(delim)
                if idx != -1 and (delim_idx == -1 or idx < delim_idx):
                    delim_idx = idx
                    used_delim = delim
            if used_delim and delim_idx != -1:
                left = header_no_date[:delim_idx].strip()
                right = header_no_date[delim_idx + len(used_delim):].strip()

                # If right part contains a comma, assume last comma separates role-suffix and company
                last_comma = right.rfind(",")
                if last_comma != -1:
                    role_suffix = right[:last_comma].strip()
                    company = right[last_comma + 1 :].strip() or None
                    role = (f"{left} {used_delim.strip()} {role_suffix}").strip(" -|") or None
                else:
                    role = left or None
                    company = right or None
            else:
                # No delimiter; treat entire line as role
                role = header_no_date or None

            current_role = role
            current_company = company
            if tail_desc:
                description_lines.append(tail_desc)
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
