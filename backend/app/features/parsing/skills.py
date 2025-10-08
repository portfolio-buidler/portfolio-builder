from __future__ import annotations
import regex as re

def parse_skills(s: str) -> list[str]:
    if not s:
        return []
    parts = re.split(r"[•|,;/:]|\s{2,}", s)
    out: list[str] = []
    for p in parts:
        p = p.strip(" .•-|")
        if not p:
            continue
        low = p.lower()
        if any(keyword in low for keyword in ["languages", "frameworks", "technologies", "soft skills"]):
            continue
        if low in {"javascript/typescript", "js/ts"}:
            out.extend(["JavaScript", "TypeScript"])
        else:
            out.append(p)
    seen: set[str] = set()
    dedup: list[str] = []
    for x in out:
        k = x.lower()
        if k in seen:
            continue
        seen.add(k)
        dedup.append(x)
    return dedup
