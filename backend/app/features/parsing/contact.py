from __future__ import annotations
from typing import List, Optional, Dict
import regex as re
import phonenumbers

EMAIL_RE = re.compile(
    r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,10}(?![A-Za-z])",
    re.I,
)
URL_RE = re.compile(r"https?://\S+", re.I)
PHONE_RE = re.compile(r"(?:\+?\d[\d\s\-().]{7,}\d)")

def _format_phone(s: str | None, country: str = "IL") -> Optional[str]:
    """Normalize phone numbers into a simplified E.164-like format.

    When the optional phonenumbers package is available, it validates and formats numbers
    into true E.164.  If the package is unavailable or parsing fails, a minimal fallback
    strips non‑digits, detects Israeli numbers and prepends +972, or simply prefixes with +.
    """
    if not s:
        return None
    raw = s.strip()
    if phonenumbers is not None:
        try:
            num = phonenumbers.parse(raw, country)
            if phonenumbers.is_valid_number(num):
                return phonenumbers.format_number(num, phonenumbers.PhoneNumberFormat.E164)
        except Exception:
            pass
    # fallback normalization
    if raw.startswith("+"):
        return raw.replace(" ", "").replace("-", "")
    digits = re.sub(r"\D", "", raw)
    if not digits:
        return s
    country_upper = (country or "").upper()
    if country_upper == "IL" and digits.startswith("0") and len(digits) == 10:
        return "+972" + digits[1:]
    if country_upper == "IL" and digits.startswith("972"):
        return "+" + digits
    return "+" + digits

def parse_contacts(lines: List[str], country: str = "IL") -> Dict[str, Optional[str]]:
    """Extract contact information from a list of text lines.

    This parser scans the first part of the document to find the candidate’s name,
    email address, phone number and social links.  It recognises bar‑separated
    header lines (e.g. “Jane Doe | Data Scientist | +1 555 123 4567 | jane@ex.com”)
    and gracefully falls back to more general heuristics when such a header is absent.
    The optional ``country`` parameter influences how local phone numbers are normalised.
    """
    top = "\n".join(lines[:8])
    all_text = "\n".join(lines)
    urls = URL_RE.findall(all_text)
    linkedin = next((u for u in urls if "linkedin.com" in u.lower()), None)
    github = next((u for u in urls if "github.com" in u.lower()), None)

    name: Optional[str] = None
    email_val: Optional[str] = None
    phone_val: Optional[str] = None

    # Scan up to ten lines for bar-separated headers
    for ln in lines[:10]:
        if "|" not in ln:
            continue
        parts = [p.strip() for p in ln.split("|") if p.strip()]
        if not parts:
            continue
        candidate = parts[0]
        tokens = candidate.split()

        # Regardless of whether the candidate looks like a name, scan every part
        # for email/phone/social links.
        for segment in parts:
            if not email_val:
                m = EMAIL_RE.search(segment)
                if m:
                    email_val = m.group(0)
            if not phone_val:
                m = PHONE_RE.search(segment)
                if m:
                    phone_val = _format_phone(m.group(0), country)
            if not linkedin and "linkedin.com" in segment.lower():
                linkedin = segment
            if not github and "github.com" in segment.lower():
                github = segment

        # Identify the name if the first part has two or more capitalised words
        if not name:
            if len(tokens) >= 2 and sum(w[:1].isupper() for w in tokens) >= 2:
                name = candidate

    # Fallback: search the first few lines and the whole document for an email
    if not email_val:
        m = EMAIL_RE.search(top) or EMAIL_RE.search(all_text)
        email_val = m.group(0) if m else None

    # Trim off any capitalised words appended after the email (e.g. “…@example.comJohn Doe”).
    if email_val:
        at_idx = email_val.find("@")
        if at_idx != -1:
            dot_idx = email_val.find(".", at_idx + 1)
            if dot_idx != -1:
                tld_end = dot_idx + 1
                for i in range(tld_end, len(email_val)):
                    if email_val[i].isupper():
                        email_val = email_val[:i]
                        break

    # Fallback: search for a phone number
    if not phone_val:
        m = PHONE_RE.search(top)
        phone_val = _format_phone(m.group(0), country) if m else None

    # Fallback heuristic for the name: look for a line with capitalised words that isn’t a section header
    if not name:
        disallow = {"skills", "experience", "projects", "education", "profile", "summary", "military", "about"}
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