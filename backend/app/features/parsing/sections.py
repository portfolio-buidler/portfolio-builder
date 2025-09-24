import re

SECTION_HEADERS = re.compile(
    r"(?im)^\s*(SUMMARY|OBJECTIVE|ABOUT|EXPERIENCE|WORK EXPERIENCE|PROJECTS|EDUCATION|SKILLS|TECHNICAL SKILLS|TOOLS|TECHNOLOGIES|TECH STACK|STACK)\b[:\-]?\s*$"
)

def split_sections(text: str) -> dict[str, str]:
    """Split text into sections based on common resume headers.

    Returns a dict from normalized header -> content block.
    Lines before the first detected header go into a special '__preamble__' block.
    """
    lines = text.split("\n")
    sections: dict[str, list[str]] = {}
    current = "__preamble__"
    sections[current] = []
    for ln in lines:
        m = SECTION_HEADERS.match(ln)
        if m:
            current = m.group(1).upper().strip()
            sections.setdefault(current, [])
        else:
            sections.setdefault(current, []).append(ln)
    return {k: "\n".join(v).strip() for k, v in sections.items() if "".join(v).strip()}
