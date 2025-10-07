import pytest
from app.features.parsing.contact import (
    EMAIL_REGEX, PHONE_REGEX, first_match, name_from_email, guess_name_from_preamble
)

# 1) EMAIL: should extract clean address in common contexts
@pytest.mark.parametrize("text, expected", [
    ('Reach me at ("pat.candidate@example.com")', "pat.candidate@example.com"),
    ("mailto:dev@example.org", "dev@example.org"),
    ("No email here", None),
])
def test_email_basic_extraction(text, expected):
    # Expect exact email or None
    assert first_match(EMAIL_REGEX, text) == expected


# 2) EMAIL: current bug — trailing letters after a valid email
# We generalize the "glued tail" with a few tails to prove the behavior.
@pytest.mark.parametrize("tail", ["LinkedIn", "Website", "XYZ"])
@pytest.mark.xfail(reason="EMAIL_REGEX currently captures trailing letters after the domain", strict=False)
def test_email_should_not_capture_glued_tail(tail):
    text = f"Contact: pat.candidate@example.com{tail}"
    assert first_match(EMAIL_REGEX, text) == "pat.candidate@example.com"


# 3) PHONE: catch common formats
@pytest.mark.parametrize("text, expected", [
    ("Call me: 202-555-0142", "202-555-0142"),
    ("+972 202 555 0142", "+972 202 555 0142"),
    ("2025550142", "2025550142"),("051-1111111","051-1111111"),
    ("No phone", None),
])
def test_phone_variants(text, expected):
    assert first_match(PHONE_REGEX, text) == expected


# 4) NAME FROM EMAIL: basic behavior
@pytest.mark.parametrize("email, expected", [
    ("pat.candidate@example.com", "Pat Candidate"),
    ("john_doe@example.net", "John Doe"),
    (None, None),
])
def test_name_from_email_basic(email, expected):
    assert name_from_email(email) == expected


# 5) NAME FROM EMAIL: decision about +tags (documented, not enforced yet)
@pytest.mark.xfail(reason="Decide policy: ignore +tags when inferring name", strict=False)
def test_name_from_email_plus_tag_should_be_ignored():
    assert name_from_email("yael+jobs@example.com") == "Yael"


# 6) NAME FROM PREAMBLE: should pick the name line, ignore contact lines
def test_guess_name_from_preamble_picks_human_name():
    preamble = "Pat Candidate\nFull Stack Developer\n+1 202 555 0142\npat.candidate@example.com"
    assert guess_name_from_preamble(preamble) == "Pat Candidate"
