from __future__ import annotations
from typing import List, Optional, Dict
import regex as re
import phonenumbers

EMAIL_RE = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.I)
URL_RE = re.compile(r"https?://\S+", re.I)
PHONE_RE = re.compile(r"(?:\+?\d[\d\s\-().]{7,}\d)")

def _format_phone(s: str | None, country="IL") -> Optional[str]:
    if not s:
        return None
    try:
        num = phonenumbers.parse(s, country)
        if phonenumbers.is_valid_number(num):
            return phonenumbers.format_number(num, phonenumbers.PhoneNumberFormat.E164)
    except Exception:
        return s
    return s

def _guess_name_from_header(lines: List[str]) -> Optional[str]:
    """Try to extract a proper name from top header lines that mix contact chunks.

    Heuristics:
    - Split by common separators (|, -, •, comma)
    - Choose the segment with 2–4 tokens, capitalized words, no digits/@
    - Prefer the earliest such segment among first 3 lines
    """
    seps = re.compile(r"\s*[|•·\-–—,]\s*")
    for ln in lines[:3]:
        parts = [p.strip() for p in seps.split(ln) if p.strip()]
        for p in parts:
            if any(ch.isdigit() for ch in p) or "@" in p.lower():
                continue
            tokens = p.split()
            if 2 <= len(tokens) <= 4 and sum(t[:1].isupper() for t in tokens) >= 2:
                return p
    return None


def parse_contacts(lines: List[str], country="IL") -> Dict[str, Optional[str]]:
    top = "\n".join(lines[:8])
    email = (EMAIL_RE.search(top) or EMAIL_RE.search("\n".join(lines)))
    email_val = email.group(0) if email else None

    phone_match = PHONE_RE.search(top)
    phone_val = _format_phone(phone_match.group(0), country) if phone_match else None

    urls = URL_RE.findall("\n".join(lines))
    linkedin = next((u for u in urls if "linkedin.com" in u.lower()), None)
    github = next((u for u in urls if "github.com" in u.lower()), None

    )

    # name heuristic: prefer header split, then fallback to first capitalized line near top
    disallow = {"skills","experience","projects","education","profile","summary","military","about"}
    name = _guess_name_from_header(lines)
    if not name:
        for ln in lines[:6]:
            t = ln.strip()
            if not t or any(k in t.lower() for k in disallow):
                continue
            if EMAIL_RE.search(t) or PHONE_RE.search(t) or URL_RE.search(t):
                continue
            tokens = t.split()
            if 1 < len(tokens) <= 6 and sum(w[:1].isupper() for w in tokens) >= 2:
                name = t
                break

    return {
        "name": name,
        "email": email_val,
        "phone": phone_val,
        "linkedin": linkedin,
        "github": github,
    }
