from pathlib import Path

def read_pdf_text(path: Path) -> str:
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
