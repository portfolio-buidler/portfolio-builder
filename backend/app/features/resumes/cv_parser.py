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
    r"(?im)^\s*(SUMMARY|OBJECTIVE|ABOUT|EXPERIENCE|WORK EXPERIENCE|PROJECTS|EDUCATION|SKILLS)\b[:\-]?\s*$"
)


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

        # Skills from section or inline fallback
        skills = None
        if "SKILLS" in sections and sections["SKILLS"]:
            # split on separators or newlines
            parts = re.split(r"[\n,\|\u00B7\u2022]", sections["SKILLS"])  # bullets/separators
            skills = [p.strip() for p in parts if p.strip()]
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
