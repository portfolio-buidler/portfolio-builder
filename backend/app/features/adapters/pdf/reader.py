from typing import List
import re
from pypdf import PdfReader

def pdf_to_text(path: str) -> str:
    reader = PdfReader(path)
    chunks: List[str] = []
    for page in reader.pages:
        chunks.append(page.extract_text() or "")
    text = "\n".join(chunks)
    text = (text
            .replace("•", "\n• ")
            .replace("\u2013", "–")
            .replace("\u2014", "-")
            .replace("\uf0b7", "•"))
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text
