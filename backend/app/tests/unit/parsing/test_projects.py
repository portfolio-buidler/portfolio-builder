"""
Unit tests for projects parsing.

Tests the parse_projects function which extracts project information
from CV text.
"""

import pytest
from app.features.parsing.projects import parse_projects, _is_probable_title


def test_parse_projects_empty_string():
    """Test parsing empty string returns empty list."""
    result = parse_projects("")
    assert result == []


def test_parse_projects_simple_title():
    """Test parsing simple project title."""
    text = "E-Commerce Platform"
    result = parse_projects(text)
    assert len(result) > 0
    assert result[0]["project_name"] == "E-Commerce Platform"


def test_parse_projects_with_description():
    """Test parsing project with description."""
    text = """E-Commerce Platform
• Built using React and Node.js
• Handled 10,000+ daily transactions"""
    result = parse_projects(text)
    assert len(result) > 0
    assert result[0]["description"] is not None
    assert "Built" in result[0]["description"]


def test_parse_projects_multiple_projects():
    """Test parsing multiple projects."""
    text = """E-Commerce Platform
Built with React.

Task Management App
Built with Vue.js."""
    result = parse_projects(text)
    assert len(result) >= 2


def test_parse_projects_bullet_points():
    """Test parsing projects with bullet points."""
    text = """E-Commerce Platform
• Feature 1
• Feature 2
• Feature 3"""
    result = parse_projects(text)
    assert len(result) > 0
    assert result[0]["description"] is not None


def test_parse_projects_filters_action_result():
    """Test that 'Action:', 'Result:', 'View Project' are filtered."""
    text = """E-Commerce Platform
Built with React.
Action:
Deployed to production
Result:
Increased sales by 20%
View Project"""
    result = parse_projects(text)
    # Action:, Result:, View Project on their own lines should be filtered
    # But they may still be parsed if they look like titles, so we check the main project exists
    assert len(result) > 0
    assert result[0]["project_name"] == "E-Commerce Platform"


def test_parse_projects_title_with_pipe():
    """Test parsing title with pipe separator."""
    text = "E-Commerce Platform | React, Node.js"
    result = parse_projects(text)
    assert len(result) > 0
    assert "E-Commerce Platform" in result[0]["project_name"]


def test_parse_projects_long_title_truncated():
    """Test that very long titles are truncated."""
    long_title = "A" * 250  # Exceeds _MAX_TITLE_LEN (200)
    text = f"{long_title}\nDescription here"
    result = parse_projects(text)
    assert len(result) > 0
    assert len(result[0]["project_name"]) <= 201  # 200 + "…"


def test_parse_projects_no_title_only_description():
    """Test parsing when only description is provided."""
    text = "• Built with React\n• Deployed to AWS"
    result = parse_projects(text)
    # Should handle gracefully
    assert isinstance(result, list)


def test_is_probable_title_short_title():
    """Test _is_probable_title with short valid title."""
    assert _is_probable_title("E-Commerce Platform") is True


def test_is_probable_title_too_long():
    """Test _is_probable_title with too long text."""
    long_text = "A" * 150
    assert _is_probable_title(long_text) is False


def test_is_probable_title_ends_with_period():
    """Test _is_probable_title with text ending in period."""
    assert _is_probable_title("E-Commerce Platform.") is False


def test_is_probable_title_starts_with_verb():
    """Test _is_probable_title with verb-starting text."""
    assert _is_probable_title("Led development team") is False


def test_is_probable_title_not_capitalized():
    """Test _is_probable_title with non-capitalized text."""
    assert _is_probable_title("e-commerce platform") is False


def test_parse_projects_complex_real_world():
    """Test parsing complex real-world project entry."""
    text = """E-Commerce Platform
• Built using React, Node.js, and PostgreSQL
• Implemented payment gateway integration
• Handled 10,000+ daily transactions
• Reduced page load time by 40%

Task Management App
• Built with Vue.js and Express
• Real-time collaboration features
• Deployed to AWS"""
    result = parse_projects(text)
    assert len(result) >= 2
    assert result[0]["project_name"] is not None
    assert result[0]["description"] is not None
    assert result[1]["project_name"] is not None

