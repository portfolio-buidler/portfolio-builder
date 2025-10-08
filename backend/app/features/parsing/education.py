from __future__ import annotations
from dataclasses import dataclass, asdict
import regex as re

DEGREE_WORDS = r"\b(?:B\.?Sc\.?|BSc|B\.?A\.?|BA|M\.?Sc\.?|MSc|M\.?A\.?|MA|Bachelor|Master|Ph\.?D\.?|Certificate)\b"
YEAR_RANGE_RE = re.compile(
    r"(?:(?:20|19)\d{2})(?:\s*[–-]\s*(?:Present|(?:20|19)\d{2}))?|Expected\s+(?:20|19)\d{2}",
    re.I,
)

@dataclass
class EducationItem:
    degree: str | None = None
    institution: str | None = None
    years: str | None = None

def parse_education(s: str) -> list[dict]:
    if not s:
        return []
    items: list[EducationItem] = []
    degree_pattern = re.compile(DEGREE_WORDS, re.I)
    lines = [ln.strip() for ln in s.split("\n") if ln.strip()]
    blocks: list[str] = []
    current: str = ""
    for ln in lines:
        if degree_pattern.search(ln) and current:
            blocks.append(current.strip())
            current = ln
        else:
            current = f"{current} {ln}".strip() if current else ln
    if current:
        blocks.append(current.strip())
    for block in blocks:
        line = " ".join(block.split())
        deg = degree_pattern.search(line)
        yrs = YEAR_RANGE_RE.search(line)
        inst: str | None = None
        if deg:
            after = line[deg.end():].strip(",|-;: ")
            inst = (
                after.split(" (", 1)[0]
                .split(" | ", 1)[0]
                .split(" - ", 1)[0]
                or None
            )
            if inst:
                inst = re.sub(r"^[.\s]*(?:in|of)\s+", "", inst, flags=re.I).strip()
                inst = re.sub(r"^(?:'s\s+)?degree\s+in\s+", "", inst, flags=re.I).strip()
        items.append(
            EducationItem(
                degree=deg.group(0) if deg else None,
                institution=inst,
                years=yrs.group(0) if yrs else None,
            )
        )
    return [asdict(x) for x in items if any([x.degree, x.institution, x.years])]
