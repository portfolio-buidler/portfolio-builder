from app.features.parsing.parser_core import parse_all_from_text

# Sample text from the CV
text = """Amir Mishayev
Full Stack Developer
LinkedIn | GitHub | 052-6880371 | Amir.Mishayev@gmail.com

SUMMARY
B.Sc. Software Engineering graduate with strong Backend and Web development skills, including
experience integrating AI. Skilled at leading small teams, turning ideas into solutions, tackling
technical challenges, writing clean code, and collaborating effectively. Seeking a challenging role
where I can contribute, guide others, and make a real impact.
EXPERIENCE
MVP Platform
I am leading a cross-functional development team in building a Modern Web Platform with an
emphasis on scalability, security, and maintainability. I define the system architecture, coordinate task
assignments, and ensure smooth collaboration between Backend, Frontend, and DevOps. My role includes
making key technical decisions and driving the project toward a stable production-ready solution.
PROJECTS
Real-Time Call Translation App
In the Real-Time Call Translation App project, I am driving the development of a mobile application
that translates calls in real-time between Hebrew, English, and Russian while preserving each
speaker's voice. I am working in collaboration of the system architecture and core implementation,
building a modular speech-to-speech pipeline using Flutter, Python, Whisper (ASR), Google NMT,
and Coqui xTTS. This project demonstrates my ability to guide the technical direction, tackle
complex technical challenges, and integrate Backend, AI, and Mobile Development to deliver a
stable, production-ready solution
Recipe Website
In the Recipe Website project, I built a responsive web app using React, TypeScript, Tailwind,
CSS, and Node.js. The site hosts 30+ recipes with search and category filters, delivering a smooth,
mobile-first user experience. This project strengthened my front-end skills and demonstrated my
ability to design intuitive, scalable web interfaces while applying UX best practices.
EDUCATION
Graduate B.Sc. in Software Engineering | Braude, Karmiel
Completed coursework in Data Structures, Algorithms, Object-Oriented Programming, Web and
Cloud Development, Network Security, and Deep Learning.
TECHNICAL SKILLS
React · TypeScript · Tailwind · CSS · Node.js · Python · Flutter · Dart · FastAPI· MySQL· MongoDB ·
PostgreSQL · Firebase/Supabase · Git · Agile Scrum"""

result = parse_all_from_text(text)
print("Parsed result:")
import json
print(json.dumps(result, indent=2))