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
    # Try the main regex first
    m = re.search(pattern, text)
    if m:
        return m.group(0)
    
    # Flexible phone regex: optional +country, optional 0, digits separated by space/dash
    flexible_phone = re.compile(r"""
        (?<!\d)                    # not preceded by a digit
        (\+?\d{1,3}[\s\-]?)?       # optional country code
        (0?[\s\-]?)?               # optional leading 0
        (\d{2,3}[\s\-]?\d{3}[\s\-]?\d{3,4})  # main number
        (?!\d)                      # not followed by a digit
    """, re.VERBOSE)
    
    m = flexible_phone.search(text)
    if m:
        return re.sub(r"\D", "", m.group(0))  # return digits only
    
    # Fallback: find any 9–11 digit cluster
    digit_cluster = re.findall(r"\d{9,11}", text)
    if digit_cluster:
        return digit_cluster[0]
    
    return None



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
    if not preamble_text:
        return None
    
    # Split by newlines OR commas (in case text was already cleaned)
    lines = re.split(r'[\n,]', preamble_text)
    
    candidates = []
    
    for ln in lines[:50]:
        s = ln.strip()
        if not s or len(s) < 5:
            continue
        
        # Skip lines with email or phone
        if re.search(EMAIL_REGEX, s) or re.search(PHONE_REGEX, s):
            continue
        
        # Skip URLs and common non-name patterns
        if re.search(r'(https?://|www\.|\.com|profile|portfolio|github|linkedin)', s, re.IGNORECASE):
            continue
        
        # Skip common section headers
        if re.match(r'^(profile|summary|objective|about|experience|education|skills|professional)', s, re.IGNORECASE):
            continue
        
        # If line contains separators (| or -), extract all parts
        if '|' in s or '–' in s or ' - ' in s:
            parts = re.split(r'\s*[|\-–]\s*', s)
            for part in parts:
                part = part.strip()
                if part:
                    candidates.append(part)
        else:
            candidates.append(s)
    
    # Now evaluate all candidates and pick the best one
    for candidate in candidates:
        # Skip if starts with special chars or numbers
        if re.match(r'^[^\w\s]', candidate) or re.match(r'^\d', candidate):
            continue
        
        # Skip locations (common patterns)
        if re.search(r'(city|state|country|israel|tel aviv|jerusalem|haifa|yavne)', candidate, re.IGNORECASE):
            continue
        
        # Skip job titles (common patterns)
        if re.search(r'(manager|engineer|developer|designer|analyst|consultant|director|specialist|coordinator)', candidate, re.IGNORECASE):
            continue
        
        words = candidate.split()
        
        # Name should be 2-4 words
        if not (2 <= len(words) <= 4):
            continue
        
        # Name should be reasonable length
        if not (5 <= len(candidate) <= 60):
            continue
        
        # Each word should start with capital letter (proper name)
        if not all(w[0].isupper() for w in words if w):
            continue
        
        # Should be mostly alphabetic (allow spaces)
        alpha_ratio = sum(c.isalpha() or c.isspace() for c in candidate) / len(candidate)
        if alpha_ratio < 0.75:
            continue
        
        # Should not be all caps (likely a header)
        if candidate.isupper():
            continue
        
        # This looks like a valid name!
        return candidate
    
    return None

