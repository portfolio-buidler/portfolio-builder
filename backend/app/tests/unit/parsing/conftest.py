# /backend/tests/unit/parsing/conftest.py
import os, sys
import pytest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

@pytest.fixture
def sample_cv_text() -> str:
    return (
        "Pat Candidate\n"
        "Full Stack Developer\n"
        "SUMMARY\n"
        "B.Sc. Software Engineering graduate with strong Backend and Web development skills.\n"
        "EXPERIENCE\n"
        "MVP Platform\n"
        "Led a cross-functional dev team...\n"
        "PROJECTS\n"
        "Real-Time Call Translation App\n"
        "EDUCATION\n"
        "B.Sc. in Software Engineering | Example University, City\n"
        "Completed coursework in Data Structures, Algorithms...\n"
        "TECHNICAL SKILLS\n"
        "React · TypeScript · Tailwind · CSS · Node.js · Python · Flutter · Dart · FastAPI · MySQL · MongoDB · PostgreSQL · Firebase/Supabase · Git · Agile Scrum\n"
        "LinkedIn | GitHub | +1 202 555 0142 | pat.candidate@example.comLinkedIn\n"
    )
