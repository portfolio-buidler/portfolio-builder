from __future__ import annotations

from pathlib import Path
from zipfile import ZipFile
from typing import Iterable, Optional

from defusedxml.ElementTree import fromstring as safe_fromstring

DOCX_WORD_NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

def _iter_docx_xml_text(zf: ZipFile, names: Iterable[str], max_nodes: int = 200_000) -> list[str]:
    lines: list[str] = []
    nodes_seen = 0
    for name in names:
        try:
            data = zf.read(name)
        except KeyError:
            continue
        root = safe_fromstring(data)
        for p in root.findall(".//w:p", DOCX_WORD_NS):
            if nodes_seen > max_nodes:
                break
            nodes_seen += 1
            texts = [t.text for t in p.findall(".//w:t", DOCX_WORD_NS) if t.text]
            if not texts:
                continue
            ln = "".join(texts).strip()
            if ln:
                lines.append(ln)
    return lines

def read_docx_text(path: Path | str) -> str:
    """Extracts visible paragraph text from DOCX, preserving rough line order."""
    p = Path(path)
    with ZipFile(p) as zf:
        names = [
            "word/document.xml",
            "word/header1.xml", "word/header2.xml",
            "word/footer1.xml", "word/footer2.xml",
        ]
        lines = _iter_docx_xml_text(zf, names)
    # Join with newlines; paragraph boundaries are meaningful for our parser
    return "\n".join(lines)
