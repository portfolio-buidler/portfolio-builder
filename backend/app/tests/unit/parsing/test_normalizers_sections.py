# Purpose: verify the "foundation" helpers work:
# - clean_text(): normalize weird dashes & newlines
# - split_sections(): detect headers and preamble correctly

from app.features.parsing.normalizers import clean_text
from app.features.parsing.sections import split_sections

def test_clean_text_normalizes_unicode_and_newlines():
    # input has special dashes and too many newlines
    raw = "A\u2013B\u2014C\u2212D\n\n\nNext"
    cleaned = clean_text(raw)
    # expect ASCII '-' and at most a double newline block
    assert cleaned == "A-B-C-D\n\nNext"

def test_split_sections_preamble_and_headers():
    # lines before the first header go into __preamble__
    text = (
        "Pat Candidate\nSoftware Engineer\n"
        "SUMMARY\nSummary line\n"
        "EXPERIENCE\nRole at Company\n"
        "SKILLS\nPython, React"
    )
    sections = split_sections(text)
    assert sections["__preamble__"].startswith("Pat Candidate")
    assert sections["SUMMARY"] == "Summary line"
    assert "Role at Company" in sections["EXPERIENCE"]
    assert "Python" in sections["SKILLS"]
