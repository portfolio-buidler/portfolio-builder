import re
from typing import Optional, Tuple
from .normalizers import normalize_phone

# Email and phone that don’t overmatch into URLs or glued text
EMAIL_REGEX = r"[A-Za-z0-9.\-+_]+@[A-Za-z0-9.\-+_]+\.[A-Za-z]{2,}(?:\.[A-Za-z]{2,})*(?![A-Za-z])"
PHONE_REGEX = (
    r"(?x)"
    r"(?<!\d)"
    r"(?:\+?\d{1,3}[\s\-]?)?"
    r"(?:0[\s\-]?)?"
    r"(?:\d{2,3}[\s\-]?\d{3}[\s\-]?\d{3,4}|\d{8,10})"
    r"(?!\d)"
)

NAME_PIPE_TITLE = re.compile(r"^([A-Z][A-Za-z'`-]+(?:\s+[A-Z][A-Za-z'`-]+){0,3})\s*\|\s*.+" )

def _first_line_name(text: str) -> Optional[str]:
    lines = text.splitlines()
    head = lines[0].strip() if lines else ""
    m = NAME_PIPE_TITLE.match(head)
    if m:
        return m.group(1)
    if 2 <= len(head.split()) <= 5 and re.match(r"^[A-Za-z\u0590-\u05FF][^\d@]+$", head):
        return head
    return None

def name_from_email(email: str | None) -> Optional[str]:
    if not email:
        return None
    local = email.split("@", 1)[0]
    parts = re.split(r"[._\-+]+", local)
    parts = [re.sub(r"\d+", "", p).strip() for p in parts if p and not p.isdigit()]
    if parts:
        return " ".join(w.capitalize() for w in parts[:4])
    return None

def guess_name_from_preamble(preamble_text: str) -> Optional[str]:
    if not preamble_text:
        return None
    # naive: first reasonable line that isn’t a header/contact/link
    for s in re.split(r"[\n,]", preamble_text)[:50]:
        s = s.strip()
        if not s or len(s) < 5:
            continue
        if re.search(EMAIL_REGEX, s) or re.search(PHONE_REGEX, s) or re.search(r"(https?://|www\.)", s, re.I):
            continue
        if re.match(r"^(profile|summary|objective|about|experience|education|skills|professional)", s, re.I):
            continue
        if any(w.lower() in s.lower() for w in ("city", "israel", "tel aviv", "jerusalem", "haifa", "yavne")):
            continue
        if re.search(r"(manager|engineer|developer|designer|analyst|consultant|director|specialist|coordinator)", s, re.I):
            continue
        words = s.split()
        if 2 <= len(words) <= 4 and not s.isupper() and s[0].isalpha():
            return s
    return None

def extract_contacts(text: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    name = _first_line_name(text) or guess_name_from_preamble(text.split("\n\n", 1)[0])
    email_m = re.search(EMAIL_REGEX, text)
    phone_m = re.search(PHONE_REGEX, text)
    email = email_m.group(0) if email_m else None
    phone_raw = phone_m.group(0) if phone_m else None
    if phone_raw:
        phone_raw = re.sub(r"\s*[-–]\s*", "-", phone_raw)  # tighten hyphen spacing
    phone = normalize_phone(phone_raw)
    return name, phone, email
