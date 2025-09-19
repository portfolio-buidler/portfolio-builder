from docx import Document

def read_docx_with_styles(docx_filename):
    doc = Document(docx_filename)
    lines = []

    for para in doc.paragraphs:
        text = para.text.strip()
        style = para.style.name if para.style else "Normal"

        if text:
            lines.append({"text": text, "style": style})

    return lines

def main():
    filename = "Hezi Alfandari - Digital Project Manager.docx"   # change to your file
    lines = read_docx_with_styles(filename)

    print("----- FULL DOCX TEXT WITH STYLES -----")
    for i, entry in enumerate(lines, start=1):
        print(f"{i:02d}: [{entry['style']}] {entry['text']}")

if __name__ == "__main__":
    main()
