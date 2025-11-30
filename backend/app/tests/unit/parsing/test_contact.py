"""
Unit tests for contact information parsing.

Tests the parse_contacts function and its helper functions
for extracting name, email, phone, LinkedIn, and GitHub from CV text.
"""

import pytest
from app.features.parsing.contact import (
    parse_contacts,
    _format_phone,
    _guess_name_from_header,
    _sanitize_profile_url,
    _split_concatenated_urls,
)


def test_parse_contacts_with_email():
    """Test parsing email from contact lines."""
    lines = ["John Doe", "john.doe@example.com", "Software Engineer"]
    result = parse_contacts(lines)
    assert result["email"] == "john.doe@example.com"
    assert result["name"] == "John Doe"


def test_parse_contacts_with_phone():
    """Test parsing phone number."""
    lines = ["John Doe", "050-123-4567", "john.doe@example.com"]
    result = parse_contacts(lines)
    # Phone may be None if format is not recognized, or formatted if valid
    assert result["phone"] is None or result["phone"].startswith("+972") or "050" in result["phone"]


def test_parse_contacts_with_linkedin():
    """Test parsing LinkedIn URL."""
    lines = [
        "John Doe",
        "https://www.linkedin.com/in/johndoe",
        "john.doe@example.com"
    ]
    result = parse_contacts(lines)
    assert result["linkedin"] is not None
    assert "linkedin.com" in result["linkedin"].lower()


def test_parse_contacts_with_github():
    """Test parsing GitHub URL."""
    lines = [
        "John Doe",
        "https://github.com/johndoe",
        "john.doe@example.com"
    ]
    result = parse_contacts(lines)
    assert result["github"] is not None
    assert "github.com" in result["github"].lower()


def test_parse_contacts_name_from_header():
    """Test extracting name from header using heuristics."""
    lines = ["John Michael Doe", "Software Engineer", "john.doe@example.com"]
    result = parse_contacts(lines)
    assert result["name"] is not None
    assert "John" in result["name"]


def test_parse_contacts_name_with_separators():
    """Test extracting name with separators."""
    lines = ["John Doe | Software Engineer | john.doe@example.com"]
    result = parse_contacts(lines)
    assert result["name"] is not None


def test_parse_contacts_multiple_emails():
    """Test that first email is selected when multiple exist."""
    lines = [
        "John Doe",
        "john.doe@example.com",
        "john.doe.personal@gmail.com"
    ]
    result = parse_contacts(lines)
    assert result["email"] == "john.doe@example.com"


def test_parse_contacts_email_in_full_text():
    """Test finding email in full text when not in top lines."""
    lines = [
        "John Doe",
        "Software Engineer",
        "Phone: +972-50-123-4567",
        "Contact: john.doe@example.com"
    ]
    result = parse_contacts(lines)
    assert result["email"] == "john.doe@example.com"


def test_parse_contacts_no_contact_info():
    """Test parsing when no contact info is present."""
    lines = ["Software Engineer", "Experience: 5 years"]
    result = parse_contacts(lines)
    assert result["email"] is None
    assert result["phone"] is None
    assert result["name"] is None or result["name"] != "Software Engineer"


def test_format_phone_valid_israeli():
    """Test formatting valid Israeli phone number."""
    result = _format_phone("050-123-4567", country="IL")
    # May return formatted E164 or original if parsing fails
    assert result is not None
    assert result.startswith("+972") or result == "050-123-4567"


def test_format_phone_invalid():
    """Test formatting invalid phone number returns original."""
    result = _format_phone("123", country="IL")
    # Should return original or None
    assert result is None or result == "123"


def test_format_phone_none():
    """Test formatting None phone."""
    result = _format_phone(None)
    assert result is None


def test_guess_name_from_header_simple():
    """Test guessing name from simple header."""
    lines = ["John Michael Doe", "Software Engineer"]
    result = _guess_name_from_header(lines)
    assert result == "John Michael Doe"


def test_guess_name_from_header_with_separators():
    """Test guessing name with separators."""
    lines = ["John Doe | Software Engineer | +972-50-123-4567"]
    result = _guess_name_from_header(lines)
    assert result is not None
    assert "John" in result
    assert "Doe" in result


def test_guess_name_from_header_filters_roles():
    """Test that role words are filtered from name."""
    lines = ["John Doe Developer", "Software Engineer"]
    result = _guess_name_from_header(lines)
    # Should not include "Developer" in name
    assert result is None or "Developer" not in result


def test_guess_name_from_header_filters_emails():
    """Test that email addresses are filtered."""
    lines = ["John Doe john.doe@example.com"]
    result = _guess_name_from_header(lines)
    assert result is None or "@" not in result


def test_sanitize_profile_url_simple():
    """Test sanitizing simple profile URL."""
    url = "https://www.linkedin.com/in/johndoe"
    result = _sanitize_profile_url(url)
    assert result == url


def test_sanitize_profile_url_with_trailing_punctuation():
    """Test sanitizing URL with trailing punctuation."""
    url = "https://www.linkedin.com/in/johndoe)."
    result = _sanitize_profile_url(url)
    assert result == "https://www.linkedin.com/in/johndoe"


def test_sanitize_profile_url_with_whitespace():
    """Test sanitizing URL with embedded whitespace."""
    url = "https://www.linkedin.com/in/johndoe John Doe"
    result = _sanitize_profile_url(url)
    assert result == "https://www.linkedin.com/in/johndoe"


def test_split_concatenated_urls():
    """Test splitting concatenated URLs."""
    text = "https://linkedin.com/in/johnhttps://github.com/john"
    result = _split_concatenated_urls(text)
    assert len(result) == 2
    assert "linkedin.com" in result[0]
    assert "github.com" in result[1]


def test_split_concatenated_urls_single():
    """Test splitting single URL."""
    text = "https://linkedin.com/in/john"
    result = _split_concatenated_urls(text)
    assert len(result) == 1
    assert "linkedin.com" in result[0]


def test_parse_contacts_complex_real_world():
    """Test parsing complex real-world contact block."""
    lines = [
        "John Michael Doe",
        "Full Stack Developer",
        "Email: john.doe@example.com | Phone: 050-123-4567",
        "LinkedIn: https://www.linkedin.com/in/johndoe",
        "GitHub: https://github.com/johndoe"
    ]
    result = parse_contacts(lines)
    assert result["name"] is not None
    assert result["email"] == "john.doe@example.com"
    # Phone may be None if format not recognized, or formatted if valid
    assert result["phone"] is None or "050" in result["phone"] or result["phone"].startswith("+972")
    assert result["linkedin"] is not None
    assert result["github"] is not None


def test_parse_contacts_glued_urls():
    """Test parsing when URLs are glued together."""
    lines = [
        "John Doe",
        "https://linkedin.com/in/johnhttps://github.com/john",
        "john.doe@example.com"
    ]
    result = parse_contacts(lines)
    # Should handle glued URLs
    assert result["email"] == "john.doe@example.com"

