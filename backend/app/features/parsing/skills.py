from __future__ import annotations
import regex as re

_CATEGORY_WORDS = {"languages", "frameworks", "technologies", "soft skills", "crm", "bi", "agile", "tools"}
_SOFT_SKILL_HINTS = {"analytical", "problem", "team", "collaboration", "adaptability", "communication", "leadership"}
_NATURAL_LANGUAGE_HINTS = {"hebrew", "english", "native", "fluent", "proficient"}

def _split_parenthetical_items(token: str) -> list[str]:
    # e.g., "BI (Power BI, Tableau, Google Data Studio)" -> ["Power BI", "Tableau", "Google Data Studio"]
    m = re.search(r"\(([^)]+)\)", token)
    if not m:
        return []
    inner = m.group(1)
    items = [x.strip() for x in re.split(r",|/|;|\|", inner) if x.strip()]
    return items

def parse_skills(s: str) -> list[str]:
    if not s:
        return []
    # Break on bullets, middle dots, pipes, commas, semicolons, slashes, or 2+ spaces
    # Also handle " . " (space-dot-space) and "·" (middle dot U+00B7)
    parts = re.split(r"[•·|,;/:]|\s+\.\s+|\s{2,}", s)
    out: list[str] = []
    for p in parts:
        p = p.strip(" .•-|")
        # Trim stray closing parenthesis from tokens like 'Asana)'
        p = p.rstrip(")")
        if not p:
            continue
        low = p.lower()
        # Drop obvious soft-skill and natural language descriptors
        if any(h in low for h in _SOFT_SKILL_HINTS) or any(h in low for h in _NATURAL_LANGUAGE_HINTS):
            continue
        # Expand parenthetical lists
        inner_items = _split_parenthetical_items(p)
        if inner_items:
            out.extend(inner_items)
            # Retain category token only if it's informative and not generic
            if all(w not in low for w in _CATEGORY_WORDS):
                out.append(p.split("(", 1)[0].strip())
            continue
        # Drop generic category tokens
        # Keep 'Agile Scrum' as a meaningful token even though it contains 'agile'
        if low == "agile scrum":
            out.append("Agile Scrum")
            continue
        if any(word in low for word in _CATEGORY_WORDS):
            continue
        # Split combos like "JavaScript/TypeScript"
        if low in {"javascript/typescript", "js/ts"}:
            out.extend(["JavaScript", "TypeScript"])
        else:
            out.append(p)
    # Deduplicate while preserving order (case-insensitive)
    seen: set[str] = set()
    dedup: list[str] = []
    for x in out:
        k = x.lower()
        if k in seen:
            continue
        seen.add(k)
        dedup.append(x)
    return dedup
