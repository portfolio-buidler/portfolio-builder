// ResumePreview.tsx
// One-page resume/portfolio site component
import React from 'react'
import type { ResumePreviewProps, ResumeData, ProjectData, WorkExperienceData } from '../../Dashboard.types'
import './ResumePreview.styles.scss'

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  data,
  mode,
  onDataChange,
}) => {
  // Handle content changes in edit mode
  const handleFieldChange = (field: keyof ResumeData, value: unknown) => {
    if (mode === 'edit' && onDataChange) {
      onDataChange({
        ...data,
        [field]: value,
      })
    }
  }

  // Split name into first and last for two-tone styling
  const nameParts = data.fullName.split(' ')
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''

  return (
    <div className={`resume-preview resume-preview--${mode}`}>
      {/* ================================================================
          HEADER - Branding + Contact Button
          ================================================================ */}
      <header className="resume-preview__header">
        <div className="resume-preview__header-content">
          <h1 className="resume-preview__name">
            <span className="name-first">{firstName}</span>{' '}
            <span className="name-last">{lastName}</span>
          </h1>
          <p 
            className="resume-preview__title"
            contentEditable={mode === 'edit'}
            suppressContentEditableWarning
            onBlur={(e) => handleFieldChange('title', e.currentTarget.textContent || '')}
          >
            {data.title}
          </p>
        </div>
        <button type="button" className="resume-preview__contact-btn">
          Contact Me
        </button>
      </header>

      {/* ================================================================
          HERO SECTION - Image + Pitch Text (Two Columns)
          ================================================================ */}
      <section className="resume-preview__hero">
        <div className="resume-preview__about-image">
          {data.avatarUrl ? (
            <img src={data.avatarUrl} alt={data.fullName} />
          ) : (
            <div className="resume-preview__about-image-placeholder" />
          )}
        </div>
        <div className="resume-preview__hero-content">
          <h2 
            className="resume-preview__headline"
            contentEditable={mode === 'edit'}
            suppressContentEditableWarning
            onBlur={(e) => handleFieldChange('headline', e.currentTarget.innerHTML || '')}
            dangerouslySetInnerHTML={{ 
              __html: formatHeadline(data.headline) 
            }}
          />
          <div className="resume-preview__description">
            <p
              contentEditable={mode === 'edit'}
              suppressContentEditableWarning
              onBlur={(e) => handleFieldChange('about', e.currentTarget.textContent || '')}
            >
              {data.about}
            </p>
          </div>
        </div>
      </section>

      {/* ================================================================
          PROJECTS SECTION - Grid of Cards
          ================================================================ */}
      <section className="resume-preview__projects">
        <div className="resume-preview__projects-grid">
          {data.projects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              mode={mode}
              onUpdate={(updatedProject) => {
                if (mode === 'edit' && onDataChange) {
                  const newProjects = [...data.projects]
                  newProjects[index] = updatedProject
                  onDataChange({ ...data, projects: newProjects })
                }
              }}
            />
          ))}
        </div>
      </section>

      {/* ================================================================
          EDUCATION & SKILLS SECTION (Side by Side)
          ================================================================ */}
      <section className="resume-preview__footer-section">
        <div className="resume-preview__education">
          <h3 className="resume-preview__section-title">Education</h3>
          {data.education.map((edu, index) => (
            <div key={index} className="resume-preview__education-item">
              <p className="resume-preview__education-degree">
                {edu.degree} – {edu.institution} ({edu.years})
              </p>
              <ul className="resume-preview__education-details">
                {edu.details.map((detail, i) => (
                  <li key={i}>{detail}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="resume-preview__skills">
          <h3 className="resume-preview__section-title">Skills</h3>
          <div className="resume-preview__skills-grid">
            {data.skills.map((skill, index) => (
              <span key={index} className="resume-preview__skill-tag">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          WORK EXPERIENCE - Full Width Green Block
          ================================================================ */}
      {data.workExperience && data.workExperience.length > 0 && (
        <section className="resume-preview__work-experience">
          <h3 className="resume-preview__section-title">Work Experience</h3>
          {data.workExperience.map((experience, index) => (
            <WorkExperienceCard
              key={experience.id || index}
              experience={experience}
              mode={mode}
              onUpdate={(updatedExperience) => {
                if (mode === 'edit' && onDataChange) {
                  const newExperience = [...data.workExperience]
                  newExperience[index] = updatedExperience
                  onDataChange({ ...data, workExperience: newExperience })
                }
              }}
            />
          ))}
        </section>
      )}
    </div>
  )
}

/**
 * Format headline to make the last part bold
 * e.g., "I Help Companies Turn Messy CV Data Into Clean, Modern Portfolio Websites."
 * -> "I Help Companies Turn Messy CV Data <strong>Into Clean, Modern Portfolio Websites.</strong>"
 */
function formatHeadline(headline: string): string {
  // Find "Into" or similar transition word and make everything after it bold
  const patterns = ['Into ', 'To ', 'For ', 'With ']
  
  for (const pattern of patterns) {
    const index = headline.indexOf(pattern)
    if (index !== -1) {
      const before = headline.slice(0, index)
      const after = headline.slice(index)
      return `${before}<strong>${after}</strong>`
    }
  }
  
  // If no pattern found, return as-is
  return headline
}

/* ==========================================================================
   PROJECT CARD COMPONENT
   ========================================================================== */

interface ProjectCardProps {
  project: ProjectData
  index: number
  mode: 'edit' | 'display'
  onUpdate: (project: ProjectData) => void
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, mode, onUpdate }) => {
  return (
    <div className="project-card">
      {/* Top - Gray placeholder/image */}
      <div className="project-card__image">
        {project.imageUrl ? (
          <img src={project.imageUrl} alt={project.name} />
        ) : (
          <div className="project-card__image-placeholder" />
        )}
      </div>
      
      {/* Bottom - Green content with white text */}
      <div className="project-card__content">
        <div className="project-card__header">
          <h4 
            className="project-card__name"
            contentEditable={mode === 'edit'}
            suppressContentEditableWarning
            onBlur={(e) => onUpdate({ 
              ...project, 
              name: e.currentTarget.textContent || project.name 
            })}
          >
            {project.name}
          </h4>
          <span className="project-card__year">{project.year}</span>
        </div>
        <p 
          className="project-card__description"
          contentEditable={mode === 'edit'}
          suppressContentEditableWarning
          onBlur={(e) => onUpdate({ 
            ...project, 
            description: e.currentTarget.textContent || project.description 
          })}
        >
          {project.description}
        </p>
        <div className="project-card__tags">
          {project.tags.map((tag, index) => (
            <span key={index} className="project-card__tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ==========================================================================
   WORK EXPERIENCE CARD COMPONENT
   ========================================================================== */

interface WorkExperienceCardProps {
  experience: WorkExperienceData
  mode: 'edit' | 'display'
  onUpdate: (experience: WorkExperienceData) => void
}

const WorkExperienceCard: React.FC<WorkExperienceCardProps> = ({ experience, mode, onUpdate }) => {
  return (
    <div className="resume-preview__experience-item">
      <div className="resume-preview__experience-header">
        <div>
          <h4 
            className="resume-preview__experience-role"
            contentEditable={mode === 'edit'}
            suppressContentEditableWarning
            onBlur={(e) => onUpdate({ 
              ...experience, 
              role: e.currentTarget.textContent || experience.role 
            })}
          >
            {experience.role}
          </h4>
          <p 
            className="resume-preview__experience-company"
            contentEditable={mode === 'edit'}
            suppressContentEditableWarning
            onBlur={(e) => onUpdate({ 
              ...experience, 
              company: e.currentTarget.textContent || experience.company 
            })}
          >
            {experience.company}
          </p>
        </div>
        <span className="resume-preview__experience-years">{experience.years}</span>
      </div>
      <p 
        className="resume-preview__experience-description"
        contentEditable={mode === 'edit'}
        suppressContentEditableWarning
        onBlur={(e) => onUpdate({ 
          ...experience, 
          description: e.currentTarget.textContent || experience.description 
        })}
      >
        {experience.description}
      </p>
      {experience.achievements && experience.achievements.length > 0 && (
        <ul className="resume-preview__experience-achievements">
          {experience.achievements.map((achievement, index) => (
            <li key={index}>{achievement}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ResumePreview
