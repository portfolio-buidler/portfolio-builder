from __future__ import annotations
from pathlib import Path
from zipfile import ZipFile
from typing import Iterable
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
    """Extract visible paragraph text from a DOCX file in a consistent order.

    Many résumé templates embed the candidate’s name and contact details in a header.
    When the header is processed after the main document the extracted text will place the
    name at the end of the document, confusing downstream heuristics.  To avoid this,
    headers are extracted **before** the main document, followed by any footers.
    """
    p = Path(path)
    with ZipFile(p) as zf:
        names: list[str] = []
        # Collect headers first
        for header in ("word/header1.xml", "word/header2.xml", "word/header3.xml"):
            if header in zf.namelist():
                names.append(header)
        names.append("word/document.xml")
        for footer in ("word/footer1.xml", "word/footer2.xml", "word/footer3.xml"):
            if footer in zf.namelist():
                names.append(footer)
        lines = _iter_docx_xml_text(zf, names)
    return "\n".join(lines)
