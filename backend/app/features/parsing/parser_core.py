from __future__ import annotations
from typing import Optional
from app.features.resumes.jsonb_models import ResumeParsedJSON
from .normalizers import clean_text
from .sections import split_sections
from .contact import EMAIL_REGEX, PHONE_REGEX, first_match, name_from_email, guess_name_from_preamble
from .skills import parse_skills, parse_skills_inline
from .education import parse_education_entries
import re

class ParserCore:
    def parse(self, raw_text: str) -> ResumeParsedJSON:
        # --- Split sections from raw text (headers preserved) ---
        sections = split_sections(raw_text)

        # --- Clean section content individually ---
        for key in sections:
            if sections[key]:
                if key == "EDUCATION":
                    # Keep newlines for parsing entries
                    continue
                sections[key] = clean_text(sections[key])
        
        
        # --- Preamble and name ---
        preamble = sections.get("__preamble__", "")
        name: Optional[str] = guess_name_from_preamble(preamble)
        if not name:
            email = first_match(EMAIL_REGEX, raw_text)
            name = name_from_email(email)



        # --- About section ---
        about = None
        for key in ("SUMMARY", "OBJECTIVE", "ABOUT", "PROFILE"):
            if key in sections and sections[key]:
                about = clean_text(sections[key])  # commas instead of \n
                break

        # --- Experience section ---
        exp_blocks = []
        for key in ("EXPERIENCE", "WORK EXPERIENCE", "PROFESSIONAL EXPERIENCE"):
            if key in sections and sections[key]:
                exp_blocks.append(clean_text(sections[key]))  # commas instead of \n
        experience = " ".join(exp_blocks) if exp_blocks else None

        # --- Education section ---
        education_raw = sections.get("EDUCATION") or None
        education = clean_text(education_raw, replace_newlines=False) if education_raw else None
        education_entries = parse_education_entries(sections) if education_raw else None

        # --- Skills ---
        skills = parse_skills(sections, raw_text)

        # fallback: scan full raw text for skills-like lines if not found in sections
        if not skills:
            m = re.search(
                r"(?im)^(skills|technical skills|tools & technologies|technologies|tech stack|stack)[:\-]?\s*(.+)$",
                raw_text
            )
            if m:
                skills_text = m.group(2)
                sep_regex = re.compile(r"\s*(?:[,\|\u00B7\u2022/;\n])+\s*")
                skills = [tok.strip() for tok in sep_regex.split(skills_text) if tok.strip()]


        # --- Phone ---
        phone = first_match(PHONE_REGEX, raw_text)
        email = first_match(EMAIL_REGEX, raw_text)

        # --- Return structured JSON ---
        return ResumeParsedJSON(
            name=name,
            email=email,
            phone=phone,
            about=about,
            experience=experience,
            education=education,
            education_entries=education_entries,
            skills=skills
        )
