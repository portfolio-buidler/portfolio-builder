import re
from .sections import SECTION_HEADERS

SKILLS_HEADERS = {
    "SKILLS",
    "TECHNICAL SKILLS",
    "TOOLS",
    "TECHNOLOGIES",
    "TECH STACK",
    "STACK",
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
    # Build the text to scan: join all skills-like sections if present
    blocks: list[str] = []
    for hdr in SKILLS_HEADERS:
        if hdr in sections and sections[hdr]:
            blocks.append(sections[hdr])

    if blocks:
        scan_text = "\n".join(blocks)
        sep_regex = re.compile(r"\s*(?:[,\|\u00B7\u2022/;]|\n)+\s*")
        raw_tokens = [tok.strip() for tok in sep_regex.split(scan_text) if tok.strip()]

        results: list[str] = []
        seen: set[str] = set()
        for tok in raw_tokens:
            inner_matches: list[tuple[int, str]] = []
            for canonical, pat in COMPILED_SKILL_PATTERNS:
                m = pat.search(tok)
                if m:
                    inner_matches.append((m.start(), canonical))
            if not inner_matches:
                continue
            inner_matches.sort(key=lambda t: t[0])
            if len(inner_matches) == 1:
                label = inner_matches[0][1]
            else:
                label = re.sub(r"\s+", " ", tok).strip()
            if label not in seen:
                seen.add(label)
                results.append(label)
        return results or None

    # Fallback: simple first-appearance across full text
    matches: list[tuple[int, str]] = []
    seen: set[str] = set()
    for canonical, pat in COMPILED_SKILL_PATTERNS:
        m = pat.search(full_text)
        if m and canonical not in seen:
            seen.add(canonical)
            matches.append((m.start(), canonical))
    if not matches:
        return None
    matches.sort(key=lambda t: t[0])
    return [name for _, name in matches]

def parse_skills_inline(text: str) -> list[str] | None:
    m = re.search(r"(?im)^\s*(skills|technical skills|technologies)\s*[:\-]\s*(.+)$", text)
    if m:
        parts = re.split(r"[,\|\u00B7\u2022]", m.group(2))
        skills = [p.strip() for p in parts if p.strip()]
        return skills or None
    return None
