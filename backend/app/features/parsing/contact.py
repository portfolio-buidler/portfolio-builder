import re

# Email: allow multi-part TLDs and prevent trailing letters (e.g., '...@gmail.comLinkedIn')
EMAIL_REGEX = r"[a-zA-Z0-9.\-+_]+@[a-zA-Z0-9.\-+_]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})*(?![A-Za-z])"

# General phone numbers pattern (verbose in original code)
PHONE_REGEX = (
    r"(?x)"                      # verbose mode
    r"(?<!\d)"                  # don't start mid-number
    r"(?:\+?\d{1,3}[\s\-]?)?" # optional country code
    r"(?:0[\s\-]?)?"            # optional trunk 0
    r"(?:"                       # main number
    r"  \d{2,3}[\s\-]?\d{3}[\s\-]?\d{4}"  # 2-3 + 3 + 4
    r"| \d{2,3}[\s\-]?\d{7}"                # 2-3 + 7
    r"| \d{8,10}"                              # or straight digits
    r")"
    r"(?!\d)"                   # don't end mid-number
)

def first_match(pattern: str, text: str) -> str | None:
    m = re.search(pattern, text)
    return m.group(0) if m else None

def name_from_email(email: str | None) -> str | None:
    if not email:
        return None
    local = email.split("@", 1)[0]
    parts = re.split(r"[._\-+]+", local)
    parts = [re.sub(r"\d+", "", p).strip() for p in parts]
    parts = [p for p in parts if p]
    if parts:
        return " ".join(w.capitalize() for w in parts[:4])
    return None

def guess_name_from_preamble(preamble_text: str) -> str | None:
    lines = preamble_text.split("\n")
    for ln in lines[:50]:
        s = ln.strip()
        if not s:
            continue
        if re.search(EMAIL_REGEX, s) or re.search(PHONE_REGEX, s):
            continue
        if len(s.split()) >= 2 and 2 <= len(s) <= 60:
            return s
    return None
