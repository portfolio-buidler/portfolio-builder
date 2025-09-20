from pathlib import Path

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
    try:
        import docx  # python-docx
        doc = docx.Document(str(path))
        lines = [p.text for p in doc.paragraphs if p.text]
        return "\n".join(lines).strip()
    except Exception:
        return ""
