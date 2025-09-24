import re
from .jsonb_models import ResumeParsedJSON


EMAIL_REGEX = r"[a-zA-Z0-9.\-+_]+@[a-zA-Z0-9.\-+_]+\.[a-zA-Z]+"
# General phone numbers:
# - Optional +country code (1-3 digits)
# - Optional trunk '0' after country code
# - National number as 2-3 + 3 + 4, or 2-3 + 7, or straight 8-10 digits
# - Allow spaces/hyphens as separators between groups
PHONE_REGEX = (
    r"(?x)"                      # verbose mode
    r"(?<!\d)"                  # don't start mid-number
    r"(?:\+?\d{1,3}[\s\-]?)?" # optional country code
    r"(?:0[\s\-]?)?"            # optional trunk 0
    r"(?:"                       # main number
    r"  \d{2,3}[\s\-]?\d{3}[\s\-]?\d{4}"  # 2-3 + 3 + 4
    r"| \d{2,3}[\s\-]?\d{7}"                # 2-3 + 7
    r"| \d{8,10}"                              # or straight digits
    r")"
    r"(?!\d)"                   # don't end mid-number
)

SECTION_HEADERS = re.compile(
    r"(?im)^\s*(SUMMARY|OBJECTIVE|ABOUT|EXPERIENCE|WORK EXPERIENCE|PROJECTS|EDUCATION|SKILLS|TECHNICAL SKILLS|TOOLS|TECHNOLOGIES|TECH STACK|STACK)\b[:\-]?\s*$"
)

# Headers that typically contain skills/tooling content
SKILLS_HEADERS = {
    "SKILLS",
    "TECHNICAL SKILLS",
    "TOOLS",
    "TECHNOLOGIES",
    "TECH STACK",
    "STACK",
}

# Curated canonical skills with regex patterns for common variants/synonyms.
# Order here does not affect the final output order; we preserve order by first appearance in text.
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

# Pre-compile regex patterns (case-insensitive, unicode) for performance
COMPILED_SKILL_PATTERNS: list[tuple[str, re.Pattern]] = [
    (name, re.compile(pattern, flags=re.IGNORECASE)) for name, pattern in CURATED_SKILL_PATTERNS.items()
]


class CVParser:
    # Text cleaning and normalization
    @staticmethod
    def _clean_text(text: str) -> str:
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    @staticmethod
    def _first_match(pattern: str, text: str) -> str | None:
        m = re.search(pattern, text)
        return m.group(0) if m else None

    @staticmethod
    def _split_sections(text: str) -> dict[str, str]:
        """Split text into sections based on common resume headers.

        Returns a dict from normalized header -> content block.
        Lines before the first detected header go into a special '__preamble__' block.
        """
        lines = text.split("\n")
        sections: dict[str, list[str]] = {}
        current = "__preamble__"
        sections[current] = []
        for ln in lines:
            if SECTION_HEADERS.match(ln):
                current = SECTION_HEADERS.match(ln).group(1).upper().strip()
                sections.setdefault(current, [])
            else:
                sections.setdefault(current, []).append(ln)
        # join
        return {k: "\n".join(v).strip() for k, v in sections.items() if "".join(v).strip()}

    def _guess_name(self, text: str) -> str | None:
        """Heuristic: first non-empty line in preamble that doesn't look like a title/link/contact."""
        pre = text.split("\n", 1)[0:50]  # first chunk
        for ln in pre:
            s = ln.strip()
            if not s:
                continue
            if re.search(EMAIL_REGEX, s) or re.search(PHONE_REGEX, s):
                continue
            if len(s.split()) >= 2 and 2 <= len(s) <= 60:
                return s
        return None

    def _parse_skills_inline(self, text: str) -> list[str] | None:
        # Look for 'Skills: a, b, c' anywhere
        m = re.search(r"(?im)^\s*(skills|technical skills|technologies)\s*[:\-]\s*(.+)$", text)
        if m:
            parts = re.split(r"[,\|\u00B7\u2022]", m.group(2))
            skills = [p.strip() for p in parts if p.strip()]
            return skills or None
        return None

    def _extract_skills_curated(self, sections: dict[str, str], full_text: str) -> list[str] | None:
        """Extract skills by matching curated patterns.

        Preferred scope is any detected skills-related section; if none, fall back to the full text.
        Returns canonical skill names ordered by first appearance.
        """
        # Build the text to scan: join all skills-like sections if present
        blocks: list[str] = []
        for hdr in SKILLS_HEADERS:
            if hdr in sections and sections[hdr]:
                blocks.append(sections[hdr])
        scan_text = "\n".join(blocks) if blocks else full_text

        matches: list[tuple[int, str]] = []  # (position, canonical)
        seen: set[str] = set()

        for canonical, pat in COMPILED_SKILL_PATTERNS:
            m = pat.search(scan_text)
            if m and canonical not in seen:
                seen.add(canonical)
                matches.append((m.start(), canonical))

        if not matches:
            return None

        matches.sort(key=lambda t: t[0])
        return [name for _, name in matches]

    # Main parsing logic
    def parse(self, raw_text: str) -> ResumeParsedJSON:
        t = self._clean_text(raw_text)

        # Basic contact info from entire text
        email = self._first_match(EMAIL_REGEX, t)
        phone = self._first_match(PHONE_REGEX, t)

        # Split by sections
        sections = self._split_sections(t)
        preamble = sections.get("__preamble__", "")

        # Name guess from preamble
        name = self._guess_name(preamble) if preamble else None

        # About/Summary
        about = None
        for key in ("SUMMARY", "OBJECTIVE", "ABOUT"):
            if key in sections and sections[key]:
                about = sections[key]
                break

        # Experience/Projects combined as one block
        exp_blocks = []
        for key in ("EXPERIENCE", "WORK EXPERIENCE", "PROJECTS"):
            if key in sections and sections[key]:
                exp_blocks.append(sections[key])
        experience = "\n\n".join(exp_blocks) or None

        # Education
        education = sections.get("EDUCATION") or None

        # Skills: curated keyword match with section preference, fallback to inline parsing
        skills = self._extract_skills_curated(sections, t)
        if not skills:
            skills = self._parse_skills_inline(t)

        return ResumeParsedJSON(
            name=name,
            email=email,
            phone=phone,
            about=about,
            experience=experience,
            education=education,
            skills=skills,
        )
