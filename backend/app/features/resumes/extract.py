import re
from PyPDF2 import PdfReader
from pathlib import Path

def extract_resume_info(pdf_filename: Path) -> dict:
    # ---------- READ PDF ----------
    reader = PdfReader(str(pdf_filename))
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"

    # Split into non-empty lines
    lines = [line.strip() for line in text.splitlines() if line.strip()]

    # ---------- NAME ----------
    name = lines[0] if lines else None

    # ---------- EMAIL & PHONE ----------
    emails = re.findall(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    phones = re.findall(r"\+?\d[\d\s\-\(\)]{7,}\d", text)

    # ---------- SECTION HEADERS ----------
    section_headers = {
        "summary": ["about", "profile", "summary", "objective"],
        "education": ["education", "academic background"],
        "experience": ["professional experience", "work experience", "employment", "career", "job", "relevant experience", "prior experience"],
        "military": ["military service", "army", "navy", "air force"],
        "skills": ["skills", "tools", "technologies"],
    }

    stop_sections = [
        "education", "experience", "skills", "tools", "projects",
        "certifications", "military service", "profile", "about",
        "summary", "languages"
    ]

    # ---------- PARSING FUNCTIONS ----------
    def parse_section(start_keywords, stop_keywords):
        content = []
        parsing = False
        for line in lines:
            line_stripped = line.strip()
            # Start parsing
            if any(re.search(rf'(?i)^\s*{kw}\s*$', line_stripped) for kw in start_keywords):
                parsing = True
                continue
            # Stop parsing if next section or ALL CAPS line
            if parsing:
                if re.match(r"^[A-Z\s]{2,}$", line_stripped) or any(sec in line_stripped.lower() for sec in stop_keywords):
                    break
            # Collect content
            if parsing and line_stripped:
                content.append(line_stripped)
        return content

    # ---------- SUMMARY / ABOUT ----------
    summary_lines = parse_section(section_headers["summary"], stop_sections)
    summary = " ".join(summary_lines).strip() if summary_lines else None

    # ---------- EDUCATION ----------
    education_lines = parse_section(section_headers["education"], stop_sections)
    education = []
    for line in education_lines:
        # Match: degree, institution, start–end year
        match = re.match(r"(?:(.+?),\s*)?(.+?)\s+(\d{4})\s*[-–]\s*(\d{4}|Present)?", line)
        if match:
            degree, institution, start_year, end_year = match.groups()
            education.append({
                "degree": degree.strip() if degree else None,
                "institution": institution.strip(),
                "start_year": start_year,
                "end_year": end_year if end_year else None
            })

    # ---------- EXPERIENCE ----------
    experience_lines = parse_section(section_headers["experience"], stop_sections)
    experience = []
    i = 0
    while i < len(experience_lines):
        line = experience_lines[i]
        match = re.match(
            rf"(?P<job>.+?)\s*(?:at|\||–|—|,)\s*(?P<company>.+?)\s*(?P<start>(?:\d{{1,2}}/\d{{4}}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b\s?\d{{4}}|\d{{4}}|Present))?\s*[-–]?\s*(?P<end>(?:\d{{1,2}}/\d{{4}}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b\s?\d{{4}}|Present|\d{{4}}))?$",
            line
        )
        if match:
            role = {
                "job": match.group("job").strip() if match.group("job") else None,
                "company": match.group("company").strip() if match.group("company") else None,
                "start_date": match.group("start").strip() if match.group("start") else None,
                "end_date": match.group("end").strip() if match.group("end") else None,
                "description": []
            }
            # Collect description lines
            i += 1
            while i < len(experience_lines):
                desc_line = experience_lines[i].strip()
                # Stop if next role or main section
                if re.search(r"(?:at|\||–|—|,)", desc_line) and re.search(r"\d{4}", desc_line):
                    break
                if re.match(r"^[A-Z\s]{3,}$", desc_line):
                    break
                role["description"].append(desc_line.strip("-• ").strip())
                i += 1
            experience.append(role)
        else:
            i += 1

    # ---------- MILITARY SERVICE ----------
    military_lines = parse_section(section_headers["military"], stop_sections)
    military = {}
    if military_lines:
        first_line = military_lines[0]
        date_match = re.search(
            r"(\d{1,2}/\d{4}|\w{3,9}\s?\d{4}|\d{4})\s*[-–]\s*(\d{1,2}/\d{4}|\w{3,9}\s?\d{4}|Present|\d{4})",
            first_line)
        if date_match:
            start_date, end_date = date_match.groups()
            military["start_date"] = start_date
            military["end_date"] = end_date
            military["role_or_branch"] = first_line[:date_match.start()].strip()
        else:
            military["description"] = " ".join(military_lines)

    # ---------- SKILLS / TOOLS ----------
    skills_lines = parse_section(section_headers["skills"], stop_sections)
    skills = []
    for line in skills_lines:
        parts = re.split(r"[,\|/\\;:-]", line)
        for part in parts:
            cleaned = part.strip()
            if cleaned and len(cleaned.split()) <= 3:
                skills.append(cleaned)

    # ---------- RESULT ----------
    return {
        "name": name,
        "email": emails[0] if emails else None,
        "phone": phones[0] if phones else None,
        "summary": summary,
        "education": education,
        "experience": experience,
        "military": military,
        "skills": skills
    }

# ---------- HELPER FOR FASTAPI ----------
def parse_resume_file(path: Path) -> dict:
    return extract_resume_info(path)
