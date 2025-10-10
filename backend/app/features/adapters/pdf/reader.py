from __future__ import annotations

from pathlib import Path
from typing import Iterable
import regex as re
from pypdf import PdfReader

# heal broken URLs that PDFs love to split
def _heal_broken_urls(text: str) -> str:
    # Do not merge separate URL lines here; rely on downstream normalizer to merge only true continuations
    return text.replace("\r\n", "\n")

def _dehyphenate(text: str) -> str:
    # remove hyphen at line end if next line continues a word
    return re.sub(r"(\w)-\n(\w)", r"\1\2", text)

def read_pdf_text(path: Path | str) -> str:
    p = Path(path)
    reader = PdfReader(str(p))
    pages = [pg.extract_text() or "" for pg in reader.pages]
    raw = "\n".join(pages)

    # Collect URLs from annotations (clickable links) that often aren't in extracted text
    urls: list[str] = []
    try:
        for page in reader.pages:
            annots = page.get("/Annots") or []
            for a in annots:
                try:
                    obj = a.get_object()
                    action = obj.get("/A")
                    if action and action.get("/URI"):
                        uri = action.get("/URI")
                        if isinstance(uri, str):
                            urls.append(uri)
                except Exception:
                    continue
    except Exception:
        # Annotation extraction is best-effort; ignore failures
        pass

    if urls:
        # Append discovered URLs at the top to help contact parsing
        raw = ("\n".join(urls) + "\n" + raw).strip()
    raw = _dehyphenate(raw)
    raw = _heal_broken_urls(raw)
    # normalize multiple blank lines
    raw = re.sub(r"\n{3,}", "\n\n", raw)
    return raw
