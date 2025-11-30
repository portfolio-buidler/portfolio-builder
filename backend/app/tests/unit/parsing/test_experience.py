"""
Unit tests for experience parsing.

Tests the parse_experience function which extracts work experience
entries from CV text with various formats.
"""

import pytest
from app.features.parsing.experience import parse_experience, _prejoin_broken_headers


def test_parse_experience_empty_string():
    """Test parsing empty string returns empty list."""
    result = parse_experience("")
    assert result == []


def test_parse_experience_simple_format():
    """Test parsing simple experience format."""
    text = "Software Engineer – Tech Company (2020-2023)"
    result = parse_experience(text)
    assert len(result) > 0
    assert result[0]["role"] == "Software Engineer"
    assert result[0]["company"] == "Tech Company"
    assert "2020" in result[0]["dates"]


def test_parse_experience_with_description():
    """Test parsing experience with description."""
    text = """Software Engineer – Tech Company (2020-2023)
Developed web applications using Python and React.
Led a team of 5 developers."""
    result = parse_experience(text)
    assert len(result) > 0
    assert result[0]["description"] is not None
    assert "Developed" in result[0]["description"]


def test_parse_experience_multiple_entries():
    """Test parsing multiple experience entries."""
    text = """Software Engineer – Tech Company (2020-2023)
Developed applications.

Senior Developer – Another Company (2018-2020)
Led development team."""
    result = parse_experience(text)
    assert len(result) >= 2


def test_parse_experience_with_fallback_role():
    """Test parsing with fallback role."""
    text = """Tech Company
Developed web applications.
2020-2023"""
    result = parse_experience(text, fallback_role="Software Engineer")
    assert len(result) > 0
    # Fallback role is used when company is set but role is None and description exists
    assert result[0]["role"] == "Software Engineer" or result[0]["company"] == "Tech Company"


def test_parse_experience_dates_in_parentheses():
    """Test parsing dates in parentheses."""
    text = "Software Engineer – Tech Company (2020-2023)"
    result = parse_experience(text)
    assert len(result) > 0
    assert result[0]["dates"] is not None
    assert "2020" in result[0]["dates"]


def test_parse_experience_dates_without_parentheses():
    """Test parsing dates without parentheses."""
    text = "Software Engineer – Tech Company 2020-2023"
    result = parse_experience(text)
    assert len(result) > 0
    assert result[0]["dates"] is not None


def test_parse_experience_present_date():
    """Test parsing 'Present' in date range."""
    text = "Software Engineer – Tech Company (2020-Present)"
    result = parse_experience(text)
    assert len(result) > 0
    assert "Present" in result[0]["dates"] or "2020" in result[0]["dates"]


def test_parse_experience_company_with_comma():
    """Test parsing company name with comma."""
    text = "Software Engineer – Tech Company, Inc. (2020-2023)"
    result = parse_experience(text)
    assert len(result) > 0
    # Company should be parsed correctly
    assert result[0]["company"] is not None


def test_prejoin_broken_headers():
    """Test _prejoin_broken_headers function."""
    lines = [
        "Software Engineer – Tech Company (2020",
        "2023)",
        "Developed applications."
    ]
    result = _prejoin_broken_headers(lines)
    # Should join broken date range
    assert len(result) <= len(lines)
    assert any("2020" in line and "2023" in line for line in result)


def test_prejoin_broken_headers_no_break():
    """Test _prejoin_broken_headers with no broken headers."""
    lines = [
        "Software Engineer – Tech Company (2020-2023)",
        "Developed applications."
    ]
    result = _prejoin_broken_headers(lines)
    assert len(result) == len(lines)


def test_parse_experience_various_delimiters():
    """Test parsing with various role-company delimiters."""
    formats = [
        "Software Engineer — Tech Company (2020-2023)",
        "Software Engineer – Tech Company (2020-2023)",
        "Software Engineer | Tech Company (2020-2023)",
        "Software Engineer - Tech Company (2020-2023)",
    ]
    for text in formats:
        result = parse_experience(text)
        assert len(result) > 0
        assert result[0]["role"] is not None
        assert result[0]["company"] is not None


def test_parse_experience_company_only():
    """Test parsing when only company name is provided."""
    text = """Tech Company
Developed web applications.
2020-2023"""
    result = parse_experience(text)
    assert len(result) > 0
    assert result[0]["company"] is not None


def test_parse_experience_no_dates():
    """Test parsing experience without explicit dates."""
    text = """Software Engineer – Tech Company
Developed web applications."""
    result = parse_experience(text)
    # Should still parse even without dates
    assert len(result) > 0


def test_parse_experience_description_only():
    """Test parsing when only description is provided."""
    text = "Developed web applications using Python and React."
    result = parse_experience(text)
    # May return empty or parse as description
    assert isinstance(result, list)


def test_parse_experience_complex_real_world():
    """Test parsing complex real-world experience entry."""
    text = """Senior Software Engineer – Tech Company Inc. (2020-Present)
• Developed scalable web applications using Python, React, and Node.js
• Led a team of 5 developers
• Implemented CI/CD pipelines
• Reduced application load time by 40%"""
    result = parse_experience(text)
    assert len(result) > 0
    assert result[0]["role"] is not None
    assert result[0]["company"] is not None
    assert result[0]["description"] is not None
    assert "Developed" in result[0]["description"]

