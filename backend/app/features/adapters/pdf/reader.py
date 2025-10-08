from __future__ import annotations

from pathlib import Path
from typing import Iterable
import regex as re
from pypdf import PdfReader

# heal broken URLs that PDFs love to split
_URL_PART = re.compile(r"(https?://[^\s)]+)", re.I)

def _heal_broken_urls(text: str) -> str:
    # join lines that split a URL in the middle (e.g., "\n" inside an http chunk)
    text = text.replace("\r\n", "\n")
    lines = text.split("\n")
    out: list[str] = []
    carry = ""
    for ln in lines:
        if carry:
            cand = carry + ln.strip()
            if _URL_PART.search(cand):
                out.append(cand)
                carry = ""
                continue
            else:
                out.append(carry)
                carry = ""
        if ln.strip().startswith("http"):
            # try to look ahead by gluing the next line later; keep in carry
            carry = ln.strip()
        else:
            out.append(ln)
    if carry:
        out.append(carry)
    return "\n".join(out)

def _dehyphenate(text: str) -> str:
    # remove hyphen at line end if next line continues a word
    return re.sub(r"(\w)-\n(\w)", r"\1\2", text)

def read_pdf_text(path: Path | str) -> str:
    p = Path(path)
    reader = PdfReader(str(p))
    pages = [pg.extract_text() or "" for pg in reader.pages]
    raw = "\n".join(pages)
    raw = _dehyphenate(raw)
    raw = _heal_broken_urls(raw)
    # normalize multiple blank lines
    raw = re.sub(r"\n{3,}", "\n\n", raw)
    return raw
