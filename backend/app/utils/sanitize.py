import re 

# Regular expressions for sanitization
_SAFE_FILENAME = re.compile(r"[^A-Za-z0-9._\-+]")
_SAFE_HEADER = re.compile(r"[^A-Za-z0-9._\-+/# ]")

# Make a safe filename by replacing risky characters and clamping length.
def safe_filename(name: str, max_len: int = 80) -> str:
    base = _SAFE_FILENAME.sub("_", name or "upload.bin").strip("._ ")
    return (base[:max_len] or "file")

# Make a safe HTTP header value without control characters.
def safe_header(value: str, max_len: int = 120) -> str:
    return _SAFE_HEADER.sub(" ", value or "").strip()[:max_len]