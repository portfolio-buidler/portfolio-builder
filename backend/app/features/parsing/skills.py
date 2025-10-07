import re
from .sections import SECTION_HEADERS

SKILLS_HEADERS = {
    "SKILLS",
    "TECHNICAL SKILLS",
    "TOOLS",
    "TECHNOLOGIES",
    "TECH STACK",
    "STACK",
    "TOOLS & TECHNOLOGIES"
}

CURATED_SKILL_PATTERNS: dict[str, str] = {
    # Frontend
    "React": r"\breact(?:\.?(?:js|jsx))?\b",
    "TypeScript": r"\btypescript\b",
    "JavaScript": r"\bjavascript\b|\bjs\b(?!on)",
    "Tailwind": r"\btailwind(?:\s*css)?\b",
    "CSS": r"\bcss\b",
    "HTML": r"\bhtml(?:5)?\b",
    # Backend / Platforms
    "Node.js": r"\bnode(?:\.?(?:js))?\b",
    "Python": r"\bpython\b",
    "FastAPI": r"\bfast\s*api\b|\bfastapi\b",
    "Django": r"\bdjango\b",
    "Flask": r"\bflask\b",
    # Mobile
    "Flutter": r"\bflutter\b",
    "Dart": r"\bdart\b",
    # Databases
    "MySQL": r"\bmy\s*sql\b|\bmysql\b",
    "PostgreSQL": r"\bpostgre(?:sql)?\b|\bpostgres\b",
    "MongoDB": r"\bmongo(?:db)?\b",
    "SQLite": r"\bsqlite\b",
    # Cloud / BaaS
    "Firebase": r"\bfirebase\b",
    "Supabase": r"\bsupabase\b",
    # DevOps / Tools
    "Git": r"\bgit\b",
    "Docker": r"\bdocker\b",
    "Kubernetes": r"\bkubernetes\b|\bk8s\b",
    # Practices / Methods
    "Agile": r"\bagile\b",
    "Scrum": r"\bscrum\b",
}

COMPILED_SKILL_PATTERNS: list[tuple[str, re.Pattern]] = [
    (name, re.compile(pattern, flags=re.IGNORECASE)) for name, pattern in CURATED_SKILL_PATTERNS.items()
]

def parse_skills(sections: dict[str, str], full_text: str) -> list[str] | None:
    # Try to get skills from known headers in sections
    blocks: list[str] = [sections[hdr] for hdr in SKILLS_HEADERS if hdr in sections and sections[hdr]]

    # Fallback: search full text for skills section headers if no section found
    if not blocks:
        m = re.search(
            r"(?im)^(skills|technical skills|tools & technologies|technologies|tech stack|stack)[:\-]?\s*(.+)$",
            full_text
        )
        if m:
            blocks.append(m.group(2))

    if not blocks:
        return None

    scan_text = "\n".join(blocks)

    # Split by commas, semicolons, pipes, bullets, parentheses, newlines
    sep_regex = re.compile(r"\s*(?:[,\|\u00B7\u2022/;\(\)\n])+\s*")
    raw_tokens = [tok.strip() for tok in sep_regex.split(scan_text) if tok.strip()]

    # Remove duplicates
    seen = set()
    results = []
    for tok in raw_tokens:
        if tok not in seen:
            seen.add(tok)
            results.append(tok)

    return results or None



def parse_skills_inline(text: str) -> list[str] | None:
    m = re.search(r"(?im)^\s*(skills|technical skills|technologies)\s*[:\-]\s*(.+)$", text)
    if m:
        parts = re.split(r"[,\|\u00B7\u2022]", m.group(2))
        skills = [p.strip() for p in parts if p.strip()]
        return skills or None
    return None
