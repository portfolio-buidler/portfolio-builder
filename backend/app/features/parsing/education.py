from __future__ import annotations
from dataclasses import dataclass, asdict
import regex as re

DEGREE_WORDS = r"\b(?:B\.?Sc\.?|BSc|B\.?A\.?|BA|M\.?Sc\.?|MSc|M\.?A\.?|MA|Bachelor|Master|Ph\.?D\.?|Bachelor'?s\s+Degree|Master'?s\s+Degree|Certificate)\b"
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
        degree_phrase: str | None = None
        if deg:
            # Expand degree phrase to include preceding words up to delimiter and trailing subject like "... Degree in X"
            # Determine boundaries: start at previous delimiter (comma or start), end at next delimiter (comma, ' - ', '(')
            start = 0
            # Move start to previous delimiter only if it appears after 0
            prev_comma = line.rfind(",", 0, deg.end())
            prev_dash = line.rfind(" - ", 0, deg.end())
            prev_pipe = line.rfind(" | ", 0, deg.end())
            prev_delim = max(prev_comma, prev_dash, prev_pipe)
            if prev_delim != -1:
                start = prev_delim + (3 if prev_delim == prev_dash or prev_delim == prev_pipe else 1)
            # End after degree and optional subject until next delimiter
            end_candidates = [
                x for x in [
                    line.find(",", deg.end()),
                    line.find(" (", deg.end()),
                    line.find(" - ", deg.end()),
                    line.find(" | ", deg.end()),
                ] if x != -1
            ]
            end = min(end_candidates) if end_candidates else len(line)
            degree_phrase = line[start:end].strip(" ,-|()")

            # Institution: text after the degree phrase to the next delimiter sequence
            after = line[end:].strip(",|-;: ")
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
                degree=degree_phrase or (deg.group(0) if deg else None),
                institution=inst,
                years=yrs.group(0) if yrs else None,
            )
        )
    return [asdict(x) for x in items if any([x.degree, x.institution, x.years])]
