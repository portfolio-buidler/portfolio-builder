# Purpose: prove two behaviors
# (A) From a SKILLS section, the parser recognizes canonical skills (subset check; extras are OK)
# (B) If there's no SKILLS section but a "skills: ..." line exists, we get a clean token list

from app.features.parsing.skills import parse_skills, parse_skills_inline
from app.features.parsing.sections import split_sections

def test_parse_skills_from_section_subset_only():
    raw = (
        "SKILLS\n"
        "React, TypeScript | Tailwind · CSS / Node.js; Python, SomethingElse\n"
        "EXPERIENCE\nCompany X"
    )
    sections = split_sections(raw)
    skills = parse_skills(sections, raw)
    assert skills is not None
    # We only require that these known ones appear; extra tokens won't fail the test
    must_have = {"React", "TypeScript", "Tailwind", "CSS", "Node.js", "Python"}
    assert must_have.issubset(set(skills))

def test_parse_skills_inline_tokens():
    raw = "Profile...\nskills: Python, Django, PostgreSQL, Docker"
    skills = parse_skills_inline(raw)
    assert skills == ["Python", "Django", "PostgreSQL", "Docker"]

def test_parse_skills_from_section_when_only_unknowns():
    """
    If the SKILLS section contains no curated skills at all,
    the parser should NOT hallucinate any and should return None.
    """
    raw = (
        "SKILLS\n"
        "FoobarLang, BizScript | UltraCSSX · HyperNode 9; Reect (typo), Pytohn (typo)\n"
    )
    sections = split_sections(raw)
    skills = parse_skills(sections, raw)

    assert skills is None  # per current implementation, None means 'no curated matches'