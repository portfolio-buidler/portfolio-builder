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

NAME_PIPE_TITLE = re.compile(r"^([A-Z][A-Za-z'`-]+(?:\s+[A-Z][A-Za-z'`-]+){0,3})\s*\|\s*.+")
CONTACT_WORD = re.compile(r"(linkedin|github|www\.|https?://)", re.I)

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
    for s in re.split(r"[\n,]", preamble_text)[:50]:
        s = s.strip()
        if not s or len(s) < 5:
            continue
        if re.search(EMAIL_REGEX, s) or re.search(PHONE_REGEX, s) or CONTACT_WORD.search(s):
            continue
        if re.match(r"^(profile|summary|objective|about|experience|education|skills|professional)", s, re.I):
            continue
        words = s.split()
        if 2 <= len(words) <= 4 and not s.isupper() and s[0].isalpha():
            return s
    return None

def _preclean_head(text: str) -> str:
    """
    Fix common extraction glitches in the first ~200 chars:
    - insert a space if digits are glued right after an email
    - normalize stray pipes/dashes spacing
    """
    head = text[:200]
    head = re.sub(rf"({EMAIL_REGEX})(?=\d)", r"\1 ", head)       # gmail.com9900 -> gmail.com 9900
    head = re.sub(r"\s*[|]\s*", " | ", head)
    head = re.sub(r"\s*[-–]\s*", " - ", head)
    return head

def _recover_israeli_rtl_phone(head: str) -> Optional[str]:
    """
    When PDF extraction flips the groups: '9900 - 388 - 050'
    Detect [4,3,3] reversed groups and reassemble to '050 - 388 - 9900'.
    Also handle variants with arbitrary separators.
    """
    # grab only the first ~120 chars where contacts usually live
    s = head[:120]
    # collect groups of 2-4 digits
    groups = re.findall(r"\d{2,4}", s)
    # if there are at least 3 groups totaling >= 9 and <= 11 digits, try reassembly
    for i in range(len(groups) - 2):
        g1, g2, g3 = groups[i], groups[i+1], groups[i+2]
        lens = list(map(len, (g1, g2, g3)))
        total = sum(lens)
        if lens == [4, 3, 3] and g3.startswith("0") and total == 10:
            return normalize_phone(f"{g3}-{g2}-{g1}")  # reverse
        # sometimes first token is 4, then 2, then 4 (rare spacing); try 4-3-3 by padding
        if total >= 9 and total <= 11 and g3.startswith("0"):
            digits = "".join((g3, g2, g1)) if len(g3) >= 3 else "".join((g3, g2, g1))
            digits = re.sub(r"\D", "", digits)
            if len(digits) == 10 and digits.startswith("0"):
                return normalize_phone(f"{digits[0:3]}-{digits[3:6]}-{digits[6:]}")
    return None

def extract_contacts(text: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    # Name
    name = _first_line_name(text) or guess_name_from_preamble(text.split("\n\n", 1)[0])

    # Email: search whole text but unglue in head first to avoid false negatives
    head = _preclean_head(text)
    email_m = re.search(EMAIL_REGEX, head) or re.search(EMAIL_REGEX, text)
    email = email_m.group(0) if email_m else None

    # Phone: try normal regex on head, then whole text, then RTL-recovery
    phone_m = re.search(PHONE_REGEX, head) or re.search(PHONE_REGEX, text)
    phone = normalize_phone(phone_m.group(0)) if phone_m else None
    if not phone:
        recovered = _recover_israeli_rtl_phone(head)
        if recovered:
            phone = recovered

    # Final tidy
    if phone:
        phone = re.sub(r"\s*-\s*", " - ", phone).strip()

    # Fallback name from email if still missing
    if not name:
        name = name_from_email(email)

    return name, phone, email