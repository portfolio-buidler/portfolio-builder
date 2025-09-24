from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET

def read_docx_text(path: Path) -> str:
    candidates: list[str] = []
    # python-docx
    try:
        import docx  # python-docx
        doc = docx.Document(str(path))
        def add_paragraphs(paragraphs, out):
            for p in paragraphs:
                s = (p.text or "").strip()
                if s:
                    out.append(s)
        lines: list[str] = []
        add_paragraphs(doc.paragraphs, lines)
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    add_paragraphs(cell.paragraphs, lines)
        for section in doc.sections:
            add_paragraphs(section.header.paragraphs, lines)
            add_paragraphs(section.footer.paragraphs, lines)
        seen = set(); uniq: list[str] = []
        for ln in lines:
            if ln not in seen:
                seen.add(ln); uniq.append(ln)
        candidates.append("\n".join(uniq).strip())
    except Exception:
        pass
    # docx2txt
    try:
        import docx2txt  # type: ignore
        txt = docx2txt.process(str(path)) or ""
        txt = txt.replace("\r\n", "\n").replace("\r", "\n").strip()
        if txt:
            candidates.append(txt)
    except Exception:
        pass
    # docx2python
    try:
        from docx2python import docx2python  # type: ignore
        with docx2python(str(path)) as d:
            flat: list[str] = []
            def _walk(x):
                if isinstance(x, (list, tuple)):
                    for y in x:
                        _walk(y)
                else:
                    s = str(x).strip()
                    if s:
                        flat.append(s)
            _walk(d.body)
            t = "\n".join(flat).replace("\r\n", "\n").replace("\r", "\n").strip()
            if t:
                candidates.append(t)
    except Exception:
        pass
    # raw XML sweep
    try:
        ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
        lines: list[str] = []
        with ZipFile(str(path), "r") as zf:
            names = [n for n in zf.namelist() if n.startswith("word/") and n.endswith(".xml") and "/_rels/" not in n]
            for name in names:
                try:
                    data = zf.read(name)
                    root = ET.fromstring(data)
                    for p in root.findall(".//w:p", ns):
                        texts = [t.text for t in p.findall(".//w:t", ns) if t.text]
                        if texts:
                            ln = "".join(texts).strip()
                            if ln:
                                lines.append(ln)
                except Exception:
                    continue
        if lines:
            candidates.append("\n".join(lines).strip())
    except Exception:
        pass
    if not candidates:
        return ""
    seen = set(); merged: list[str] = []
    for txt in candidates:
        for ln in txt.replace("\r\n", "\n").replace("\r", "\n").split("\n"):
            s = ln.strip()
            if s and s not in seen:
                seen.add(s); merged.append(s)
    return "\n".join(merged).strip()
