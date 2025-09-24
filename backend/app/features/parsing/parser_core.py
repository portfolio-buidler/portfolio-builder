from __future__ import annotations
from typing import Optional
from app.features.resumes.jsonb_models import ResumeParsedJSON
from .normalizers import clean_text
from .sections import split_sections
from .contact import EMAIL_REGEX, PHONE_REGEX, first_match, name_from_email, guess_name_from_preamble
from .skills import parse_skills, parse_skills_inline
from .education import parse_education_entries


class ParserCore:
    def parse(self, raw_text: str) -> ResumeParsedJSON:
        t = clean_text(raw_text)
        email = first_match(EMAIL_REGEX, t)
        phone = first_match(PHONE_REGEX, t)
        sections = split_sections(t)
        preamble = sections.get("__preamble__", "")
        name: Optional[str] = guess_name_from_preamble(preamble) if preamble else None
        if not name:
            name = name_from_email(email)

        about = None
        for key in ("SUMMARY", "OBJECTIVE", "ABOUT"):
            if key in sections and sections[key]:
                about = sections[key]
                break

        exp_blocks = []
        for key in ("EXPERIENCE", "WORK EXPERIENCE", "PROJECTS"):
            if key in sections and sections[key]:
                exp_blocks.append(sections[key])
        experience = "\n\n".join(exp_blocks) or None

        education = sections.get("EDUCATION") or None
        education_entries = parse_education_entries(sections)

        skills = parse_skills(sections, t)
        if not skills:
            skills = parse_skills_inline(t)

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
