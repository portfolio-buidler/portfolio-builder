# Purpose: given typical education lines, return structured entries (degree + institution)
# We don't care which university; we care that the parser extracts something sensible.

import pytest
from app.features.parsing.education import parse_education
from app.features.parsing.sections import find_sections

def test_parse_education_basic_entry():
    raw = (
        "EDUCATION\n"
        "B.Sc. in Software Engineering | Example University, City\n"
        "Relevant coursework: Data Structures, Algorithms"
    )
    sections, _ = find_sections(raw)
    # parse_education takes the education section text string
    entries = parse_education(sections.get("education", ""))
    assert entries and len(entries) >= 1
    e0 = entries[0]
    assert e0["degree"] is not None
    assert e0["institution"] is not None and len(e0["institution"]) > 1  # any non-empty institution is fine

@pytest.mark.parametrize("edu_line", [
    # Different real-world shapes (keywords, acronyms, with/without year)
    "B.Sc. in Computer Science | Large Tech University — 2023",
    "B.Sc. in Software Engineering | HIT — Holon Institute of Technology",
    "Bachelor of Science in CS | Tech Institute of Science",
    "B.Sc. in CS | College of Computing and Design",
    "B.Sc. CS | University of Somewhere",
    "M.Sc. CS | University of Somewhere",
])
def test_various_institution_formats_are_parsed(edu_line):
    raw = f"EDUCATION\n{edu_line}\nRelevant coursework: Algorithms, Data Structures"
    sections, _ = find_sections(raw)
    entries = parse_education(sections.get("education", ""))
    assert entries and len(entries) >= 1
    e0 = entries[0]
    assert e0["degree"] is not None
    assert e0["institution"] is not None and len(e0["institution"]) >= 2  # not asserting exact text
