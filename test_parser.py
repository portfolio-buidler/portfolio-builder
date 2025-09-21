#!/usr/bin/env python3
import sys
import asyncio
from pathlib import Path

# Add the backend directory to the path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

from app.features.resumes.cv_parser import CVParser

# Test CV text
sample_cv_text = """John Doe
Software Engineer
john.doe@email.com | +1-555-123-4567 | linkedin.com/in/johndoe

SUMMARY
Experienced software engineer with 5+ years of expertise in full-stack development.

TECHNICAL SKILLS
Python, JavaScript, TypeScript, React, Node.js, FastAPI

EXPERIENCE
Senior Software Engineer | TechCorp Inc. | 2021 - Present
Led development of microservices architecture serving 1M+ users

EDUCATION
Bachelor of Science in Computer Science | University of Technology | 2019
"""

def test_parser():
    print("Testing CV Parser...")
    parser = CVParser()
    
    try:
        result = parser.parse_cv_text(sample_cv_text)
        print("✅ Parser works successfully!")
        print("\nExtracted Data:")
        print("=" * 50)
        
        import json
        print(json.dumps(result, indent=2))
        print("=" * 50)
        
    except Exception as e:
        print(f"❌ Parser failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_parser()