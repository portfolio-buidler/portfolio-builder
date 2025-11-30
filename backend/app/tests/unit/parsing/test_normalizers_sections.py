# Purpose: verify the "foundation" helpers work:
# - normalize_text(): normalize weird dashes & newlines
# - find_sections(): detect headers correctly

from app.features.parsing.normalizers import normalize_text
from app.features.parsing.sections import find_sections

def test_normalize_text_normalizes_unicode_and_newlines():
    # input has special dashes and too many newlines
    raw = "A\u2013B\u2014C\u2212D\n\n\nNext"
    cleaned = normalize_text(raw)
    # expect Unicode normalization and at most a double newline block
    assert "A" in cleaned and "B" in cleaned and "Next" in cleaned
    # Should not have more than 2 consecutive newlines
    assert "\n\n\n" not in cleaned

def test_find_sections_detects_headers():
    # Test that sections are properly detected
    text = (
        "Pat Candidate\nSoftware Engineer\n"
        "SUMMARY\nSummary line\n"
        "EXPERIENCE\nRole at Company\n"
        "SKILLS\nPython, React"
    )
    sections, lines = find_sections(text)
    # find_sections uses lowercase keys based on SECTION_ALIASES
    assert "about" in sections  # SUMMARY maps to "about"
    assert "experience" in sections
    assert "skills" in sections
    # Check content was extracted
    assert "Role at Company" in sections["experience"]
    assert "Python" in sections["skills"]
