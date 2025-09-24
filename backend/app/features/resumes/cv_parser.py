import re
from .jsonb_models import ResumeParsedJSON, EducationEntry


# Email: allow multi-part TLDs and prevent trailing letters (e.g., '...@gmail.comLinkedIn')
EMAIL_REGEX = r"[a-zA-Z0-9.\-+_]+@[a-zA-Z0-9.\-+_]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})*(?![A-Za-z])"
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
        # Normalize newlines and common Unicode punctuation:
        # - Convert NBSP to regular space
        # - Convert various Unicode dashes to ASCII hyphen so phone regex works
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        text = text.translate(str.maketrans({
            "\u00A0": " ",  # NBSP
            "\u2010": "-",  # hyphen
            "\u2011": "-",  # non-breaking hyphen
            "\u2012": "-",  # figure dash
            "\u2013": "-",  # en dash
            "\u2014": "-",  # em dash
            "\u2015": "-",  # horizontal bar
            "\u2212": "-",  # minus sign
        }))
        # Remove zero-width characters and soft hyphens
        text = text.replace("\u200B", "").replace("\u200C", "").replace("\u200D", "").replace("\u00AD", "")
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    @staticmethod
    def _first_match(pattern: str, text: str) -> str | None:
        m = re.search(pattern, text)
        return m.group(0) if m else None

    @staticmethod
    def _name_from_email(email: str | None) -> str | None:
        if not email:
            return None
        local = email.split("@", 1)[0]
        # Split by common separators and remove digits
        parts = re.split(r"[._\-+]+", local)
        parts = [re.sub(r"\d+", "", p).strip() for p in parts]
        parts = [p for p in parts if p]
        if len(parts) >= 1:
            # Capitalize each token
            return " ".join(w.capitalize() for w in parts[:4])  # cap to a few tokens
        return None

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
        lines = text.split("\n")
        for ln in lines[:50]:  # scan first ~50 lines
            s = ln.strip()
            if not s:
                continue
            if re.search(EMAIL_REGEX, s) or re.search(PHONE_REGEX, s):
                continue
            if len(s.split()) >= 2 and 2 <= len(s) <= 60:
                return s
        return None

    # -------- Education parsing ---------
    _YEAR_PAT = re.compile(r"\b(19\d{2}|20\d{2})(?:\s*[–\-]\s*(19\d{2}|20\d{2}))?\b")
    _DEGREE_PAT = re.compile(
        r"\b((?:B\.?(?:Sc|A)|B(?:Sc|A)|Bachelor(?:'s)?|M(?:\.?(?:Sc|A)|aster(?:'s)?)|PhD|Doctorate|Diploma|Associate)(?:[^\n\|,.;]{0,80})?)",
        re.IGNORECASE,
    )
    _INSTITUTION_HINT_PAT = re.compile(r"\b(University|College|Institute|Polytechnic|Academy|School)\b", re.IGNORECASE)

    def _split_lines(self, text: str) -> list[str]:
        return [ln.strip() for ln in text.split("\n") if ln.strip()]

    def _extract_education_entries(self, sections: dict[str, str]) -> list[EducationEntry] | None:
        edu = sections.get("EDUCATION")
        if not edu:
            return None

        lines = self._split_lines(edu)
        entries: list[EducationEntry] = []
        for ln in lines:
            year_match = self._YEAR_PAT.search(ln)
            year = None
            if year_match:
                year = year_match.group(0)

            degree = None
            deg_m = self._DEGREE_PAT.search(ln)
            if deg_m:
                degree = deg_m.group(1).strip()

            institution = None
            # Heuristic: institution contains hint words or capitalized proper nouns
            cand_parts = re.split(r"[,\-\u2013;]|\s\|\s", ln)
            cand_parts = [p.strip() for p in cand_parts if p.strip()]
            for part in cand_parts:
                if self._INSTITUTION_HINT_PAT.search(part):
                    institution = part
                    break

            # Fallback: capitalized chunk that isn't (part of) the degree
            if not institution:
                caps = re.findall(r"\b([A-Z][A-Za-z&.'’\-]*(?:\s+[A-Z][A-Za-z&.'’\-]*)*)\b", ln)
                for c in caps:
                    if not degree or c.lower() not in degree.lower():
                        if len(c.split()) >= 1 and len(c) <= 120:
                            institution = c
                            break

            if degree or institution or year:
                entries.append(EducationEntry(degree=degree, institution=institution, year=year))

        return entries or None

    def _parse_skills_inline(self, text: str) -> list[str] | None:
        # Look for 'Skills: a, b, c' anywhere
        m = re.search(r"(?im)^\s*(skills|technical skills|technologies)\s*[:\-]\s*(.+)$", text)
        if m:
            parts = re.split(r"[,\|\u00B7\u2022]", m.group(2))
            skills = [p.strip() for p in parts if p.strip()]
            return skills or None
        return None

    def _extract_skills_curated(self, sections: dict[str, str], full_text: str) -> list[str] | None:
        """Extract skills by matching curated patterns with separator-aware tokenization.

        - Prefer scanning skills-related sections; else fall back to the entire text.
        - If scanning sections: split by inferred separators (commas, pipes, bullets, slashes, semicolons, newlines).
          Treat a token without inner separators as a single item: if it contains multiple curated matches
          (e.g., 'Agile Scrum'), return the token itself as one combined label.
        - If falling back to full text (no skills sections), do simple first-appearance matching of curated terms.
        """
        # Build the text to scan: join all skills-like sections if present
        blocks: list[str] = []
        for hdr in SKILLS_HEADERS:
            if hdr in sections and sections[hdr]:
                blocks.append(sections[hdr])

        if blocks:
            scan_text = "\n".join(blocks)

            # Split sections by common separators, but DO NOT split on plain spaces.
            # This lets multi-word tokens like 'Agile Scrum' stay intact.
            sep_regex = re.compile(r"\s*(?:[,\|\u00B7\u2022/;]|\n)+\s*")
            raw_tokens = [tok.strip() for tok in sep_regex.split(scan_text) if tok.strip()]

            results: list[str] = []
            seen: set[str] = set()

            for tok in raw_tokens:
                # Within this token, find curated matches in order of appearance
                inner_matches: list[tuple[int, str]] = []
                for canonical, pat in COMPILED_SKILL_PATTERNS:
                    m = pat.search(tok)
                    if m:
                        inner_matches.append((m.start(), canonical))

                if not inner_matches:
                    # Unrecognized token; skip silently (we only output curated skills/composites)
                    continue

                inner_matches.sort(key=lambda t: t[0])

                if len(inner_matches) == 1:
                    # Single match -> output canonical name
                    label = inner_matches[0][1]
                else:
                    # Multiple curated matches but no separators inside token -> composite label.
                    # Return the token text itself to preserve how the resume author grouped them
                    # (e.g., 'Agile Scrum'). Normalize extra spaces.
                    label = re.sub(r"\s+", " ", tok).strip()

                if label not in seen:
                    seen.add(label)
                    results.append(label)

            return results or None

        # Fallback: no skills sections found -> simple first-appearance across full text
        scan_text = full_text
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

        # Name guess from preamble; fallback to name derived from email if preamble is empty
        name = self._guess_name(preamble) if preamble else None
        if not name:
            name = self._name_from_email(email)

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

        # Education - free text and structured entries
        education = sections.get("EDUCATION") or None
        education_entries = self._extract_education_entries(sections)

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
            education_entries=education_entries,
            skills=skills,
        )
