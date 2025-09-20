import re
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class ContactInfo:
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None

@dataclass
class Education:
    degree: str
    institution: str
    year: Optional[str] = None
    gpa: Optional[str] = None
    description: Optional[str] = None

@dataclass
class Experience:
    title: str
    company: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: List[str] = None
    
    def __post_init__(self):
        if self.description is None:
            self.description = []

@dataclass
class Project:
    name: str
    description: Optional[str] = None
    technologies: List[str] = None
    url: Optional[str] = None
    
    def __post_init__(self):
        if self.technologies is None:
            self.technologies = []

@dataclass
class ParsedCV:
    name: Optional[str] = None
    contact: ContactInfo = None
    summary: Optional[str] = None
    skills: List[str] = None
    experience: List[Experience] = None
    education: List[Education] = None
    projects: List[Project] = None
    languages: List[str] = None
    certifications: List[str] = None
    
    def __post_init__(self):
        if self.contact is None:
            self.contact = ContactInfo()
        if self.skills is None:
            self.skills = []
        if self.experience is None:
            self.experience = []
        if self.education is None:
            self.education = []
        if self.projects is None:
            self.projects = []
        if self.languages is None:
            self.languages = []
        if self.certifications is None:
            self.certifications = []

class CVParser:
    def __init__(self):
        # Common section headers (case-insensitive)
        self.section_patterns = {
            'contact': r'(?:contact|personal\s+info|details)',
            'summary': r'(?:summary|objective|profile|about|overview)',
            'skills': r'(?:skills|technical\s+skills|competencies|technologies)',
            'experience': r'(?:experience|work\s+experience|employment|professional\s+experience|career)',
            'education': r'(?:education|academic|qualifications|studies)',
            'projects': r'(?:projects|personal\s+projects|portfolio)',
            'languages': r'(?:languages|language\s+skills)',
            'certifications': r'(?:certifications?|certificates?|credentials)'
        }
    
    def parse_cv_text(self, text: str) -> Dict[str, Any]:
        """Parse CV text and extract structured information."""
        cv = ParsedCV()
        
        # Clean and normalize text
        text = self._clean_text(text)
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        # Extract name (usually first non-empty line or most prominent text)
        cv.name = self._extract_name(lines)
        
        # Extract contact information
        cv.contact = self._extract_contact_info(text)
        
        # Split text into sections
        sections = self._split_into_sections(text)
        
        # Parse each section
        for section_type, section_text in sections.items():
            if section_type == 'summary':
                cv.summary = self._extract_summary(section_text)
            elif section_type == 'skills':
                cv.skills = self._extract_skills(section_text)
            elif section_type == 'experience':
                cv.experience = self._extract_experience(section_text)
            elif section_type == 'education':
                cv.education = self._extract_education(section_text)
            elif section_type == 'projects':
                cv.projects = self._extract_projects(section_text)
            elif section_type == 'languages':
                cv.languages = self._extract_languages(section_text)
            elif section_type == 'certifications':
                cv.certifications = self._extract_certifications(section_text)
        
        # Convert to dictionary for JSON serialization
        return self._to_dict(cv)

    # Clean and normalize text 
    def _clean_text(self, text: str) -> str:
        text = text.replace('\r\n', '\n').replace('\r', '\n')
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'[^\w\s@\.\-\+\(\)\[\]/:,;]', ' ', text)
        return text.strip()
    
    def _extract_name(self, lines: List[str]) -> Optional[str]:
        """Extract the person's name, typically from the first few lines."""
        for line in lines[:5]:  # Check first 5 lines
            # Skip lines that look like headers, emails, or phone numbers
            if (len(line.split()) >= 2 and len(line.split()) <= 4 and 
                not re.search(r'@|phone|email|tel|mobile', line.lower()) and
                not re.search(r'^\d+', line) and len(line) < 50):
                # Check if it looks like a name (letters and spaces only, proper length)
                if re.match(r'^[A-Za-z\s\.\-\']+$', line) and len(line) > 3:
                    return line.title()
        return None
    
    def _extract_contact_info(self, text: str) -> ContactInfo:
        """Extract contact information."""
        contact = ContactInfo()
        
        # Email
        email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
        if email_match:
            contact.email = email_match.group()
        
        # Phone (various formats)
        phone_patterns = [
            r'(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})',
            r'\+?[\d\s\-\(\)]{10,}',
        ]
        for pattern in phone_patterns:
            phone_match = re.search(pattern, text)
            if phone_match:
                contact.phone = phone_match.group().strip()
                break
        
        # LinkedIn
        linkedin_match = re.search(r'(?:linkedin\.com/in/|linkedin\.com/pub/)([A-Za-z0-9\-]+)', text, re.IGNORECASE)
        if linkedin_match:
            contact.linkedin = f"linkedin.com/in/{linkedin_match.group(1)}"
        
        # GitHub
        github_match = re.search(r'(?:github\.com/)([A-Za-z0-9\-]+)', text, re.IGNORECASE)
        if github_match:
            contact.github = f"github.com/{github_match.group(1)}"
        
        # Website
        website_match = re.search(r'https?://(?:www\.)?([A-Za-z0-9\-\.]+\.[A-Za-z]{2,})', text)
        if website_match:
            contact.website = website_match.group()
        
        return contact
    
    def _split_into_sections(self, text: str) -> Dict[str, str]:
        """Split CV text into sections based on common headers."""
        sections = {}
        
        for section_name, pattern in self.section_patterns.items():
            # Find section headers
            section_match = re.search(rf'\b{pattern}\b', text, re.IGNORECASE | re.MULTILINE)
            if section_match:
                start_pos = section_match.end()
                
                # Find the next section header or end of text
                next_section_start = len(text)
                for other_pattern in self.section_patterns.values():
                    if other_pattern != pattern:
                        next_match = re.search(rf'\b{other_pattern}\b', text[start_pos:], re.IGNORECASE)
                        if next_match:
                            next_section_start = min(next_section_start, start_pos + next_match.start())
                
                section_text = text[start_pos:next_section_start].strip()
                if section_text:
                    sections[section_name] = section_text
        
        return sections
    
    def _extract_summary(self, section_text: str) -> Optional[str]:
        """Extract summary/objective section."""
        # Take the first paragraph that's long enough
        paragraphs = [p.strip() for p in section_text.split('\n') if p.strip()]
        for paragraph in paragraphs:
            if len(paragraph) > 50:  # Reasonable length for a summary
                return paragraph
        return section_text[:500] if len(section_text) > 20 else None
    
    def _extract_skills(self, section_text: str) -> List[str]:
        """Extract skills from skills section."""
        skills = []
        
        # Split by common delimiters
        delimiters = [',', '•', '●', '·', '|', ';', '\n']
        text = section_text
        
        for delimiter in delimiters:
            if delimiter in text:
                parts = [part.strip() for part in text.split(delimiter)]
                skills.extend([p for p in parts if p and len(p) > 1 and len(p) < 50])
                break
        
        # If no delimiters found, try to extract individual words/phrases
        if not skills:
            words = re.findall(r'\b[A-Za-z][A-Za-z\s\+\#\.]{1,20}\b', section_text)
            skills = [w.strip() for w in words if len(w.strip()) > 2]
        
        return skills[:20]  # Limit to reasonable number
    
    def _extract_experience(self, section_text: str) -> List[Experience]:
        """Extract work experience entries."""
        experiences = []
        
        # Split by potential job entries (look for patterns like company names or dates)
        lines = [line.strip() for line in section_text.split('\n') if line.strip()]
        
        current_exp = None
        for line in lines:
            # Look for date patterns (might indicate a new job entry)
            date_pattern = r'\b(?:19|20)\d{2}\b|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)'
            
            if re.search(date_pattern, line) or len(line.split()) <= 6:
                # Might be a job title/company line
                if current_exp and current_exp.title:
                    experiences.append(current_exp)
                
                parts = line.split('|') if '|' in line else line.split('-')
                current_exp = Experience(
                    title=parts[0].strip(),
                    company=parts[1].strip() if len(parts) > 1 else "Unknown",
                )
                
                # Extract dates if present
                dates = re.findall(r'\b(?:19|20)\d{2}\b', line)
                if dates:
                    current_exp.start_date = dates[0]
                    current_exp.end_date = dates[1] if len(dates) > 1 else "Present"
            
            elif current_exp and len(line) > 20:
                # Might be a description
                current_exp.description.append(line)
        
        if current_exp and current_exp.title:
            experiences.append(current_exp)
        
        return experiences[:10]  # Limit to reasonable number
    
    def _extract_education(self, section_text: str) -> List[Education]:
        """Extract education entries."""
        education = []
        
        lines = [line.strip() for line in section_text.split('\n') if line.strip()]
        
        for line in lines:
            # Look for degree patterns
            degree_keywords = ['bachelor', 'master', 'phd', 'doctorate', 'diploma', 'certificate', 'degree']
            if any(keyword in line.lower() for keyword in degree_keywords):
                parts = line.split('|') if '|' in line else line.split('-')
                
                degree_text = parts[0].strip()
                institution = parts[1].strip() if len(parts) > 1 else "Unknown"
                
                # Extract year
                year_match = re.search(r'\b(?:19|20)\d{2}\b', line)
                year = year_match.group() if year_match else None
                
                education.append(Education(
                    degree=degree_text,
                    institution=institution,
                    year=year
                ))
        
        return education[:5]  # Limit to reasonable number
    
    def _extract_projects(self, section_text: str) -> List[Project]:
        """Extract project entries."""
        projects = []
        
        # Similar to experience extraction but looking for project patterns
        lines = [line.strip() for line in section_text.split('\n') if line.strip()]
        
        current_project = None
        for line in lines:
            if len(line.split()) <= 8 and not line.startswith('-') and not line.startswith('•'):
                # Might be a project name
                if current_project:
                    projects.append(current_project)
                
                current_project = Project(name=line)
            elif current_project and len(line) > 10:
                # Might be description
                if current_project.description:
                    current_project.description += " " + line
                else:
                    current_project.description = line
        
        if current_project:
            projects.append(current_project)
        
        return projects[:8]  # Limit to reasonable number
    
    def _extract_languages(self, section_text: str) -> List[str]:
        """Extract languages."""
        # Similar to skills extraction
        languages = []
        delimiters = [',', '•', '●', '·', '|', ';', '\n']
        
        for delimiter in delimiters:
            if delimiter in section_text:
                parts = [part.strip() for part in section_text.split(delimiter)]
                languages.extend([p for p in parts if p and len(p) > 1 and len(p) < 30])
                break
        
        return languages[:10]
    
    def _extract_certifications(self, section_text: str) -> List[str]:
        """Extract certifications."""
        certifications = []
        lines = [line.strip() for line in section_text.split('\n') if line.strip()]
        
        for line in lines:
            if len(line) > 5 and len(line) < 100:  # Reasonable length for certification
                certifications.append(line)
        
        return certifications[:10]
    
    def _to_dict(self, cv: ParsedCV) -> Dict[str, Any]:
        """Convert ParsedCV object to dictionary."""
        def convert_dataclass(obj):
            if hasattr(obj, '__dataclass_fields__'):
                result = {}
                for field in obj.__dataclass_fields__:
                    value = getattr(obj, field)
                    if isinstance(value, list):
                        result[field] = [convert_dataclass(item) for item in value]
                    else:
                        result[field] = convert_dataclass(value) if hasattr(value, '__dataclass_fields__') else value
                return result
            return obj
        
        return convert_dataclass(cv)