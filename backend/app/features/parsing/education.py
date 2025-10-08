from __future__ import annotations
from dataclasses import dataclass, asdict
import regex as re
from .normalizers import split_blocks

DEGREE_WORDS = r"(B\.?Sc\.?|BSc|B\.?A\.?|BA|M\.?Sc\.?|MSc|M\.?A\.?|MA|Bachelor|Master|Ph\.?D\.?)"
YEAR_RANGE_RE = re.compile(r"(?:(?:20|19)\d{2})(?:\s*[–-]\s*(?:Present|(?:20|19)\d{2}))?|Expected\s+(?:20|19)\d{2}", re.I)

@dataclass
class EducationItem:
    degree: str | None = None
    institution: str | None = None
    years: str | None = None

def parse_education(s: str) -> list[dict]:
    if not s:
        return []
    items: list[EducationItem] = []
    for block in split_blocks(s):
        line = " ".join(block.split())
        deg = re.search(DEGREE_WORDS, line, re.I)
        yrs = YEAR_RANGE_RE.search(line)
        inst = None
        if deg:
            after = line[deg.end():].strip(",|-;: ")
            # crude chop
            inst = after.split(" (")[0].split(" | ")[0].split(" - ")[0] or None
        items.append(EducationItem(
            degree=deg.group(0) if deg else None,
            institution=inst,
            years=yrs.group(0) if yrs else None
        ))
    return [asdict(x) for x in items]
