from pathlib import Path

def extract_text_from_pdf(path: Path) -> str:
    try:
        from pypdf import PdfReader
    except ImportError:
        return ""
    try:
        reader = PdfReader(str(path))
        out = []
        for page in reader.pages:
            out.append(page.extract_text() or "")
        return "\n".join(out)
    except Exception:
        return ""

def extract_text_from_docx(path: Path) -> str:
    try:
        import docx  # python-docx
    except ImportError:
        return ""
    try:
        doc = docx.Document(str(path))
        return "\n".join(p.text for p in doc.paragraphs if p.text)
    except Exception:
        return ""
