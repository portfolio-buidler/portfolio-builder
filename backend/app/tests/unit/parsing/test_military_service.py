"""
Unit tests for military service parsing.

Tests the clean_military_service function which extracts and cleans
military service information from CV text.
"""

import pytest
from app.features.parsing.military_service import clean_military_service


def test_clean_military_service_with_valid_text():
    """Test cleaning valid military service text."""
    text = "IDF - Intelligence Unit\nServed as Analyst\n2015-2018"
    result = clean_military_service(text)
    assert result == text
    assert "IDF" in result
    assert "Intelligence" in result


def test_clean_military_service_stops_at_languages():
    """Test that cleaning stops when 'languages' prefix is found."""
    text = "IDF - Intelligence Unit\nServed as Analyst\nlanguages: Hebrew, English"
    result = clean_military_service(text)
    assert result == "IDF - Intelligence Unit\nServed as Analyst"
    assert "languages" not in result


def test_clean_military_service_stops_at_skills():
    """Test that cleaning stops when 'skills' prefix is found."""
    text = "IDF - Intelligence Unit\nServed as Analyst\nskills: Python, React"
    result = clean_military_service(text)
    assert result == "IDF - Intelligence Unit\nServed as Analyst"
    assert "skills" not in result


def test_clean_military_service_with_empty_string():
    """Test cleaning with empty string."""
    result = clean_military_service("")
    assert result is None


def test_clean_military_service_with_none():
    """Test cleaning with None input."""
    result = clean_military_service(None)
    assert result is None


def test_clean_military_service_with_whitespace_only():
    """Test cleaning with whitespace-only string."""
    result = clean_military_service("   \n\n   ")
    assert result is None


def test_clean_military_service_case_insensitive_stop():
    """Test that stop prefixes are case-insensitive."""
    text = "IDF - Intelligence Unit\nLANGUAGES: Hebrew, English"
    result = clean_military_service(text)
    assert result == "IDF - Intelligence Unit"
    assert "LANGUAGES" not in result


def test_clean_military_service_multiline():
    """Test cleaning multiline military service text."""
    text = """IDF - Intelligence Unit
Served as Analyst
Responsible for data analysis
2015-2018"""
    result = clean_military_service(text)
    assert result == text
    assert "\n" in result


def test_clean_military_service_preserves_formatting():
    """Test that formatting is preserved when no stop prefix is found."""
    text = "IDF - Intelligence Unit\nServed as Analyst\n2015-2018"
    result = clean_military_service(text)
    assert result == text
    assert result.count("\n") == 2

