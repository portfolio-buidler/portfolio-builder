from __future__ import annotations
import regex as re
from ftfy import fix_text # type: ignore

NBSP = "\xa0"

def normalize_text(s: str) -> str:
    # Unicode fixes first
    s = fix_text(s or "")
    s = s.replace(NBSP, " ")
    # normalize bullets to a single char
    s = s.replace("•", "•").replace("·", "•")
    # collapse whitespace
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"[ \t]+\n", "\n", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()

def heal_urls(s: str) -> str:
    # merge "https://example.\ncom/path" -> "https://example.com/path"
    s = re.sub(r"(https?://[^\s]+)\.\n([^\s]+)", r"\1.\2", s, flags=re.I)
    s = re.sub(r"(https?://[^\s]+)\n([^\s]+)", r"\1\2", s, flags=re.I)
    return s

def split_blocks(text: str) -> list[str]:
    return [b.strip() for b in re.split(r"\n{2,}", text) if b.strip()]
