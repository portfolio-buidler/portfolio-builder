from __future__ import annotations
from typing import Tuple, Dict, List
import regex as re

SECTION_ALIASES = {
    "about": [
        "summary",
        "profile",
        "about",
        "about me",
        "professional summary",
        "career summary",
        "personal statement",
        "professional profile",
    ],
    "skills": [
        "skills",
        "technical skills",
        "tech stack",
        "technologies",
        "tools",
        "tools & technologies",
        "core competencies",
    ],
    "education": ["education", "studies", "academic"],
    "experience": [
        "experience",
        "work experience",
        "professional experience",
        "employment",
        "extras",
    ],
    "projects": ["projects", "portfolio", "selected projects"],
    "military_service": [
        "military",
        "military service",
        "idf",
        "idf service",
        "naval service",
        "army service",
        "air force",
    ],
}


def _extract_first_paragraph_after_contacts(lines: List[str], stop_idx: int) -> str:
    """Extract the first descriptive paragraph after top contact area.

    Heuristics:
    - Consider only first ~10 lines for contact area.
    - Detect emails/phones/urls and short separators as contact.
    - The first non-empty paragraph after that is the about text, truncated
      if a section heading appears inline.
    """
    EMAIL = re.compile(r"@")
    PHONE = re.compile(r"\+?\d[\d\s\-()]{6,}")
    URL = re.compile(r"(https?://|www\.)", re.I)

    # Find end of contact block (first 8-10 lines)
    start_idx = 0
    for i, ln in enumerate(lines[: min(len(lines), 10)]):
        t = ln.strip()
        low = t.lower()
        if not t:
            continue
        is_contact = EMAIL.search(low) or PHONE.search(low) or URL.search(low)
        is_short_sep = bool(re.fullmatch(r"[\s\|•·\-–—]+", t))
        looks_like_contact_chunk = any(k in low for k in ("linkedin", "github", "email", "phone"))
        if is_contact or is_short_sep or looks_like_contact_chunk or (len(t) < 5):
            start_idx = i + 1
        else:
            # If we already saw some contact lines, stop when hitting a substantial line
            if start_idx > 0 and len(t) > 10:
                break

    # Accumulate all lines after contacts until next heading or blank line
    para: list[str] = []
    alias_inlines = [
        re.compile(rf"\b{re.escape(alias)}\b", re.I)
        for aliases in SECTION_ALIASES.values()
        for alias in aliases
    ]
    for ln in lines[start_idx:stop_idx]:
        t = ln.strip()
        if not t:
            if para:
                break
            continue
        # Stop if a section heading is detected at line start
        if any(t.upper().startswith(a.upper()) for a in SECTION_ALIASES.keys()):
            break
        # If a section alias appears inline, include only the part before the alias and stop
        earliest = None
        for p in alias_inlines:
            m = p.search(t)
            if m:
                if earliest is None or m.start() < earliest:
                    earliest = m.start()
        if earliest is not None:
            chunk = t[:earliest].strip()
            if chunk:
                para.append(chunk)
            break
        para.append(t)
    # Join lines into a single paragraph
    joined = " ".join(para)
    # De-duplicate spaces
    joined = re.sub(r"\s+", " ", joined).strip()
    return joined

def find_sections(text: str) -> Tuple[Dict[str, str], List[str]]:
    lines = [l.rstrip() for l in text.splitlines()]

    # Preprocess: split any line that contains a section alias mid-line into separate lines,
    # so that aliases start a line and can be detected robustly.
    all_aliases: list[str] = [a for aliases in SECTION_ALIASES.values() for a in aliases]
    split_lines: list[str] = []
    for ln in lines:
        work = ln
        changed = True
        # Iteratively split on alias occurrences that look like section headers
        while changed and work:
            changed = False
            # 1) Prefer alias at start of the line (ignoring leading spaces)
            lstripped = work.lstrip()
            lead = len(work) - len(lstripped)
            low_start = lstripped.lower()
            start_alias = next((a for a in all_aliases if low_start.startswith(a)), None)
            if start_alias:
                pre = work[:lead]
                alias_chunk = lstripped[: len(start_alias)]
                post = lstripped[len(start_alias) :].lstrip(" :-\t")
                if pre.strip():
                    split_lines.append(pre.rstrip())
                # Push alias as its own line
                split_lines.append(alias_chunk.strip())
                # If there is remainder, push as next line and keep processing
                if post:
                    work = post
                else:
                    work = ""
                changed = True
                continue

            # 2) Otherwise allow mid-line split only after punctuation boundary and capitalized alias
            low = work.lower()
            best_idx = -1
            best_alias = None
            for a in all_aliases:
                pos = low.find(a)
                if pos == -1:
                    continue
                # Require boundary before alias to be punctuation-like
                if pos > 0 and work[pos - 1] not in ".:;|()•·-–— \t\u00a0":
                    continue
                # Require the alias in original text to start with uppercase (looks like a heading)
                if not work[pos : pos + 1].isupper():
                    continue
                # Require word boundary after alias only for single-word aliases (avoid matching 'work' in 'workflow')
                if " " not in a:
                    end = pos + len(a)
                    if end < len(work) and work[end].isalnum():
                        continue
                if best_idx == -1 or pos < best_idx:
                    best_idx = pos
                    best_alias = a
            if best_alias is not None:
                pre = work[:best_idx]
                alias_chunk = work[best_idx : best_idx + len(best_alias)]
                post = work[best_idx + len(best_alias) :].lstrip(" :-\t")
                if pre.strip():
                    split_lines.append(pre.rstrip())
                # Push alias as its own line
                split_lines.append(alias_chunk.strip())
                if post:
                    work = post
                else:
                    work = ""
                changed = True
                continue
            # 3) If alias is glued to next word (e.g., 'LinkedIn|https://...'), split at the alias and treat the rest as a new line
            for a in all_aliases:
                pos = low.find(a)
                if pos != -1:
                    # If alias is not at start, but glued to next word, split
                    if pos > 0 and (work[pos - 1] not in ".:;|()•·-–— \t\u00a0" or work[pos - 1].isalnum()):
                        pre = work[:pos]
                        alias_chunk = work[pos : pos + len(a)]
                        post = work[pos + len(a) :].lstrip(" :-\t")
                        if pre.strip():
                            split_lines.append(pre.rstrip())
                        split_lines.append(alias_chunk.strip())
                        if post:
                            work = post
                        else:
                            work = ""
                        changed = True
                        break
            if changed:
                continue
            break
        if not changed and work is not None:
            split_lines.append(work)
    lines = split_lines

    # Detect headings; support inline content on same line as heading
    def _looks_like_heading(s: str, alias: str) -> bool:
        t = s.strip()
        if not t:
            return False
        tlow = t.lower().rstrip(":")
        if tlow == alias:
            return True
        if not tlow.startswith(alias):
            return False
        # Remaining text after alias
        rem = t[len(t) :]
        # Heuristics: short, not sentence-like, title-ish
        if t.endswith('.'):
            return False
        if len(t) <= 40 and (t.isupper() or t.istitle() or t.endswith(':')):
            return True
        # If alias is multi-word (e.g., "professional experience"), allow looser check
        if ' ' in alias and len(t) <= 50:
            return True
        return False

    idxs: list[tuple[int, str]] = []
    inline_remainders: Dict[int, str] = {}
    for i, ln in enumerate(lines):
        raw = ln.strip()
        for key, aliases in SECTION_ALIASES.items():
            for a in aliases:
                if _looks_like_heading(raw, a):
                    idxs.append((i, key))
                    remainder = raw[len(a) :].strip(" :\t-–—")
                    if remainder:
                        inline_remainders[i] = remainder
                    break
    idxs.sort()

    sections: Dict[str, str] = {k: "" for k in SECTION_ALIASES}
    for n, (i, key) in enumerate(idxs):
        j = idxs[n + 1][0] if n + 1 < len(idxs) else len(lines)
        body_lines = []
        # include inline remainder if present for this heading line
        if i in inline_remainders:
            body_lines.append(inline_remainders[i])
        body_lines.extend(lines[i + 1 : j])
        sections[key] = "\n".join(body_lines).strip()

    # Fallback: about = first paragraph after contacts until first heading
    if not sections.get("about"):
        first_section_line = idxs[0][0] if idxs else len(lines)
        about = _extract_first_paragraph_after_contacts(lines, first_section_line)
        if about:
            sections["about"] = about

    return sections, lines
