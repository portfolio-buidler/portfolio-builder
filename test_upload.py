# Test script to upload a CV and see the JSON response
import requests
import json

# Create a sample CV content for testing
sample_cv_content = """John Doe
Software Engineer
john.doe@email.com | +1-555-123-4567 | linkedin.com/in/johndoe | github.com/johndoe

SUMMARY
Experienced software engineer with 5+ years of expertise in full-stack development, 
specializing in Python, JavaScript, and cloud technologies. Passionate about creating 
scalable solutions and leading development teams.

TECHNICAL SKILLS
Python, JavaScript, TypeScript, React, Node.js, FastAPI, Django, PostgreSQL, MongoDB, 
Docker, AWS, Git, CI/CD, REST APIs, GraphQL

EXPERIENCE

Senior Software Engineer | TechCorp Inc. | 2021 - Present
• Led development of microservices architecture serving 1M+ users
• Implemented CI/CD pipelines reducing deployment time by 60%
• Mentored 3 junior developers and conducted code reviews
• Technologies: Python, FastAPI, PostgreSQL, Docker, AWS

Software Developer | StartupXYZ | 2019 - 2021  
• Developed full-stack web applications using React and Node.js
• Built RESTful APIs and integrated third-party services
• Collaborated with design team to implement responsive UI components
• Technologies: JavaScript, React, Node.js, MongoDB, Express

EDUCATION
Bachelor of Science in Computer Science | University of Technology | 2019
• GPA: 3.8/4.0
• Relevant coursework: Data Structures, Algorithms, Database Systems

PROJECTS
E-commerce Platform
Full-stack e-commerce application with payment integration
Technologies: React, Node.js, PostgreSQL, Stripe API

Task Management App  
Real-time collaborative task management tool
Technologies: Vue.js, Socket.io, MongoDB

CERTIFICATIONS
AWS Certified Solutions Architect
Docker Certified Associate

LANGUAGES
English (Native), Spanish (Intermediate), French (Basic)
"""

def test_upload():
    # Save sample CV to a temporary file
    with open('sample_cv.txt', 'w') as f:
        f.write(sample_cv_content)
    
    # Upload the file
    url = 'http://127.0.0.1:9000/resumes/upload'
    
    try:
        with open('sample_cv.txt', 'rb') as f:
            files = {'file': ('sample_cv.txt', f, 'text/plain')}
            response = requests.post(url, files=files)
        
        if response.status_code == 201:
            print("✅ Upload successful!")
            print("\nResponse JSON:")
            print("=" * 50)
            result = response.json()
            print(json.dumps(result, indent=2))
            print("=" * 50)
            
            # Extract just the parsed data for cleaner view
            if result.get('data') and result['data'].get('extractedData'):
                parsed_data = result['data']['extractedData'].get('parsed_data', {})
                print("\n📋 EXTRACTED CV DATA:")
                print("=" * 50)
                print(json.dumps(parsed_data, indent=2))
                print("=" * 50)
        else:
            print(f"❌ Upload failed with status {response.status_code}")
            print("Response:", response.text)
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure it's running on http://127.0.0.1:9000")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        # Clean up
        import os
        try:
            os.remove('sample_cv.txt')
        except:
            pass

if __name__ == "__main__":
    test_upload()