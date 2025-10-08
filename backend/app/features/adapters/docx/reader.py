from typing import List
from zipfile import ZipFile
from defusedxml.ElementTree import fromstring as safe_fromstring  # pip install defusedxml

DOCX_WORD_NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

def docx_to_text(path: str, max_nodes: int = 300_000) -> str:
    lines: List[str] = []
    nodes_seen = 0
    with ZipFile(path) as zf:
        # prefer main document; include headers/footers if present
        names = [n for n in zf.namelist() if n in (
            "word/document.xml", "word/header1.xml", "word/footer1.xml"
        ) or n.startswith(("word/header", "word/footer"))]
        for name in names:
            try:
                data = zf.read(name)
                root = safe_fromstring(data)
            except Exception:
                continue
            for p in root.findall(".//w:p", DOCX_WORD_NS):
                if nodes_seen > max_nodes:
                    break
                texts = [t.text for t in p.findall(".//w:t", DOCX_WORD_NS) if t.text]
                if texts:
                    ln = "".join(texts).strip()
                    if ln:
                        lines.append(ln)
                nodes_seen += 1
    text = "\n".join(lines)
    # normalize like PDF to keep downstream regexes stable
    text = (text.replace("•", "\n• ")
                .replace("\u2013", "–")
                .replace("\u2014", "-")
                .replace("\uf0b7", "•"))
    return text.strip()
