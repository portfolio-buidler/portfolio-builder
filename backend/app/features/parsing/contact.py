from __future__ import annotations
from typing import List, Optional, Dict
import regex as re
import phonenumbers

EMAIL_RE = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.I)
# Capture standalone URLs; we'll also split concatenated sequences later
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
        # Remove obvious labels like 'LinkedIn'/'GitHub' before splitting
        ln_clean = re.sub(r"\b(LinkedIn|GitHub|Email|Phone)\b", "", ln, flags=re.I)
        # Drop any URL segments first to avoid gluing
        ln_clean = re.sub(URL_RE, " ", ln_clean)
        parts = [p.strip() for p in seps.split(ln_clean) if p.strip()]
        for p in parts:
            if any(ch.isdigit() for ch in p) or "@" in p.lower():
                continue
            tokens = p.split()
            # Avoid common role words
            if re.search(r"\b(Developer|Engineer|Manager|Lead|Architect|Designer|Student)\b", p, re.I):
                continue
            if 2 <= len(tokens) <= 4 and sum(t[:1].isupper() for t in tokens) >= 2:
                return p
    return None


def _split_concatenated_urls(s: str) -> List[str]:
    # Split sequences like "http://a...http://b..." into separate URLs
    parts: List[str] = []
    for m in re.finditer(r"https?://", s, flags=re.I):
        parts.append(m.start())
    if not parts:
        return []
    idxs = parts + [len(s)]
    out: List[str] = []
    for i in range(len(parts)):
        out.append(s[idxs[i]:idxs[i+1]].strip())
    return [x for x in out if x]

def _sanitize_profile_url(u: str) -> str:
    # Remove trailing tokens that aren't part of the URL (e.g., appended names without separators)
    u = u.strip().rstrip(').,;')
    # If there's an embedded whitespace (rare), cut at first whitespace
    if re.search(r"\s", u):
        u = u.split()[0]
    return u

def parse_contacts(lines: List[str], country="IL") -> Dict[str, Optional[str]]:
    top = "\n".join(lines[:12])
    # Prefer the first clear email anywhere, but strip 'mailto:' if present in source text
    full_text = "\n".join(lines)
    email_match = (EMAIL_RE.search(top) or EMAIL_RE.search(full_text))
    email_val = email_match.group(0) if email_match else None

    # Robust phone extraction: use phonenumbers matcher on the top block first
    phone_val: Optional[str] = None
    try:
        for m in phonenumbers.PhoneNumberMatcher(top.replace('|', ' '), country):
            if phonenumbers.is_valid_number(m.number):
                phone_val = phonenumbers.format_number(m.number, phonenumbers.PhoneNumberFormat.E164)
                break
        if not phone_val:
            for m in phonenumbers.PhoneNumberMatcher(full_text.replace('|', ' '), country):
                if phonenumbers.is_valid_number(m.number):
                    phone_val = phonenumbers.format_number(m.number, phonenumbers.PhoneNumberFormat.E164)
                    break
    except Exception:
        # fallback to previous regex if phonenumbers failed
        phone_match = PHONE_RE.search(top)
        phone_val = _format_phone(phone_match.group(0), country) if phone_match else None

    raw = full_text
    urls = URL_RE.findall(raw)
    # Also handle glued URLs on the same line by splitting them
    extra_urls: List[str] = []
    for u in urls:
        if "http" in u and u.count("http") > 1:
            extra_urls.extend(_split_concatenated_urls(u))
    if extra_urls:
        urls.extend(extra_urls)
    # Clean urls and strip trailing punctuation/artifacts; split glued ones
    clean_urls: List[str] = []
    for u in urls:
        if "http" in u and u.count("http") > 1:
            clean_urls.extend([p.strip().rstrip(').,;') for p in _split_concatenated_urls(u)])
        else:
            clean_urls.append(_sanitize_profile_url(u))
    # Dedup preserve order
    seen: set[str] = set()
    dedup_urls: List[str] = []
    for u in clean_urls:
        if u in seen:
            continue
        seen.add(u)
        dedup_urls.append(u)
    linkedin = next((u for u in dedup_urls if "linkedin.com" in u.lower()), None)
    github = next((u for u in dedup_urls if "github.com" in u.lower()), None)
    # Sometimes LinkedIn/GitHub get glued with extra tokens; trim after profile slug when obviously wrong
    if linkedin and not re.match(r"https?://(www\.)?linkedin\.com/", linkedin, re.I):
        # try to split at first occurrence of 'linkedin.com/'
        m = re.search(r"https?://[^\s]*linkedin\.com/[^\s]*", linkedin, re.I)
        if m:
            linkedin = _sanitize_profile_url(m.group(0))
    if github and not re.match(r"https?://(www\.)?github\.com/", github, re.I):
        m = re.search(r"https?://[^\s]*github\.com/[^\s]*", github, re.I)
        if m:
            github = _sanitize_profile_url(m.group(0))

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
            # Avoid picking job titles as names by requiring at least 2 words and no trailing 'Developer/Engineer/Manager'
            if 1 < len(tokens) <= 6 and sum(w[:1].isupper() for w in tokens) >= 2 and not re.search(r"\b(Developer|Engineer|Manager|Lead|Consultant|Architect|Designer|Student)\b", t, re.I):
                name = t
                break

    return {
        "name": name,
        "email": email_val,
        "phone": phone_val,
        "linkedin": linkedin,
        "github": github,
    }
