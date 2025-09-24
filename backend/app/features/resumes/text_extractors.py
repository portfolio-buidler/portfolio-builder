from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET

def extract_text_from_pdf(path: Path) -> str:
    try:
        import pypdf
        text = []
        with open(path, "rb") as f:
            reader = pypdf.PdfReader(f)
            for page in reader.pages:
                text.append(page.extract_text() or "")
        return "\n".join(text).strip()
    except Exception:
        return ""

def extract_text_from_docx(path: Path) -> str:
    """Extract text from DOCX including body paragraphs, tables, headers and footers.

    Note: python-docx does not extract text from shapes/textboxes; for those cases
    consider adding a fallback extractor (e.g., docx2txt/docx2python) in the future.
    """
    candidates: list[str] = []
    # Primary: python-docx
    try:
        import docx  # python-docx
        doc = docx.Document(str(path))

        def add_paragraphs(paragraphs, out):
            for p in paragraphs:
                txt = (p.text or "").strip()
                if txt:
                    out.append(txt)

        lines: list[str] = []
        add_paragraphs(doc.paragraphs, lines)  # body
        for table in doc.tables:  # tables
            for row in table.rows:
                for cell in row.cells:
                    add_paragraphs(cell.paragraphs, lines)
        for section in doc.sections:  # headers/footers
            add_paragraphs(section.header.paragraphs, lines)
            add_paragraphs(section.footer.paragraphs, lines)

        # Deduplicate while preserving order
        seen = set()
        uniq_lines: list[str] = []
        for ln in lines:
            if ln not in seen:
                seen.add(ln)
                uniq_lines.append(ln)
        candidates.append("\n".join(uniq_lines).strip())
    except Exception:
        pass

    # Fallback: docx2txt (may extract from textboxes better)
    try:
        import docx2txt  # type: ignore
        txt = docx2txt.process(str(path)) or ""
        txt = txt.replace("\r\n", "\n").replace("\r", "\n").strip()
        if txt:
            candidates.append(txt)
    except Exception:
        pass

    # Fallback: docx2python (as a last resort)
    try:
        from docx2python import docx2python  # type: ignore
        with docx2python(str(path)) as doc:
            # doc.body is nested lists; flatten to lines
            flat: list[str] = []
            def _walk(x):
                if isinstance(x, (list, tuple)):
                    for y in x:
                        _walk(y)
                else:
                    s = str(x).strip()
                    if s:
                        flat.append(s)
            _walk(doc.body)
            txt = "\n".join(flat).replace("\r\n", "\n").replace("\r", "\n").strip()
            if txt:
                candidates.append(txt)
    except Exception:
        pass

    # Fallback: raw XML scan of all Word XML parts (headers/footers/textboxes)
    try:
        ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
        lines: list[str] = []
        with ZipFile(str(path), "r") as zf:
            # collect relevant xml parts: document, headers, footers, and anything under word/ ending with .xml
            xml_names = [n for n in zf.namelist() if n.startswith("word/") and n.endswith(".xml") and "/_rels/" not in n]
            for name in xml_names:
                try:
                    data = zf.read(name)
                    root = ET.fromstring(data)
                    # iterate paragraphs; join all text runs
                    for p in root.findall(".//w:p", ns):
                        texts = [t.text for t in p.findall(".//w:t", ns) if t.text]
                        if texts:
                            ln = "".join(texts).strip()
                            if ln:
                                lines.append(ln)
                except Exception:
                    # skip problematic part
                    continue
        if lines:
            candidates.append("\n".join(lines).strip())
    except Exception:
        pass

    # Combine all candidates by union of lines to avoid missing header-only content
    if not candidates:
        return ""
    seen = set()
    merged: list[str] = []
    for txt in candidates:
        for ln in (txt.replace("\r\n", "\n").replace("\r", "\n").split("\n")):
            s = ln.strip()
            if s and s not in seen:
                seen.add(s)
                merged.append(s)
    return "\n".join(merged).strip()
