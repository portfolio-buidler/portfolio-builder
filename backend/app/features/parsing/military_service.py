from __future__ import annotations
from typing import Optional

_STOP_PREFIXES = ("languages", "skills")

def clean_military_service(text: Optional[str]) -> Optional[str]:
    if not text or not isinstance(text, str):
        return None
    lines = text.split("\n")
    clean: list[str] = []
    for ln in lines:
        low = ln.strip().lower()
        if any(low.startswith(p) for p in _STOP_PREFIXES):
            break
        clean.append(ln)
    result = "\n".join(clean).strip()
    return result or None
