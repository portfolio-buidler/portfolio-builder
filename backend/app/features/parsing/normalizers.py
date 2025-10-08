import re
from typing import Iterable

def clean_text(text: str | None, replace_newlines: bool = True) -> str:
    if not text:
        return ""
    text = text.replace("\\n", "\n").replace("\r\n", "\n").replace("\r", "\n")
    text = text.translate(str.maketrans({
        "\u00A0": " ",  # NBSP
        "\u2010": "-",  # hyphen
        "\u2011": "-",  # non-breaking hyphen
        "\u2012": "-",  # figure dash
        "\u2013": "-",  # en dash
        "\u2014": "-",  # em dash
        "\u2015": "-",  # horizontal bar
        "\u2212": "-",  # minus sign
    }))
    text = text.replace("\u200B", "").replace("\u200C", "").replace("\u200D", "").replace("\u00AD", "")
    text = re.sub(r"[ \t]+", " ", text)
    if replace_newlines:
        text = re.sub(r"\n+", ", ", text)
    return text.strip()

def normalize_phone(s: str | None) -> str | None:
    if not s:
        return None
    s = re.sub(r"\s*-\s*", " - ", s)
    s = re.sub(r"\s{2,}", " ", s).strip()
    return s

def dedup_ordered(items: Iterable[str]) -> list[str]:
    seen, out = set(), []
    for x in items:
        k = x.strip().lower()
        if k and k not in seen:
            seen.add(k)
            out.append(x.strip())
    return out
