import React from 'react'
import type { PreviewAreaViewProps } from './PreviewArea.types'
import './PreviewArea.styles.scss'
import {
  AboutSection,
  EducationSection,
  SkillsSection,
  CommunicationSection,
  ExperienceSection,
} from './Sections'

/**
 * Stateless presentational component for the preview area. This component
 * takes a list of sections along with navigation callbacks and renders
 * them according to the glass dark mode design guidelines. All layout
 * related classes are defined in the accompanying SCSS file. See
 * PreviewArea.styles.scss for the styling rules.
 */
export const PreviewAreaView: React.FC<PreviewAreaViewProps> = ({
  sections,
  onPageBack,
  onUndo,
  onRedo,
  onNext,
  undoAvailable,
  redoAvailable,
  isNextEnabled,
  onToggleEducation,
  isEducationCollapsed,
  onAddLink,
}) => {
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Extract specific sections by id for layout
  const about = sections.find((s) => s.id === 'about')
  const education = sections.find((s) => s.id === 'education')
  const skills = sections.find((s) => s.id === 'skills')
  const communication = sections.find((s) => s.id === 'communication')
  const experience = sections.find((s) => s.id === 'experience')

  React.useEffect(() => {
    const contentElement = contentRef.current
    if (!contentElement) return

    const getSectionEl = (sectionClass: string): HTMLElement | null =>
      contentElement.querySelector(`.preview-section--${sectionClass}`) as HTMLElement | null

    const handleScroll = () => {
      const scrollTop = contentElement.scrollTop
      const clientHeight = contentElement.clientHeight
      const lineHeight = 296
      const maxTravel = clientHeight - lineHeight

      // Find about and experience sections
      const aboutEl = getSectionEl('about')
      const experienceEl = getSectionEl('experience')
      
      if (!aboutEl || !experienceEl) {
        // Fallback to center if sections not found
        contentElement.style.setProperty('--scroll-indicator-top', '50%')
        contentElement.style.setProperty('--scroll-indicator-transform', 'translateY(-50%)')
        return
      }

      // Get offsets relative to scroll container
      const aboutTop = aboutEl.offsetTop
      const experienceBottom = experienceEl.offsetTop + experienceEl.offsetHeight
      
      // Indicator should start when about is at top, end when experience bottom is at viewport bottom
      const scrollStart = aboutTop
      const scrollEnd = experienceBottom - clientHeight
      const scrollableRange = scrollEnd - scrollStart

      // If not enough content to scroll between anchors, center the line
      if (scrollableRange <= 0) {
        contentElement.style.setProperty('--scroll-indicator-top', '50%')
        contentElement.style.setProperty('--scroll-indicator-transform', 'translateY(-50%)')
        return
      }

      // Calculate scroll progress between the two anchors
      // When scrollTop < scrollStart: indicator at 0%
      // When scrollTop >= scrollEnd: indicator at 100%
      // In between: linear interpolation
      let scrollProgress = 0
      if (scrollTop <= scrollStart) {
        scrollProgress = 0
      } else if (scrollTop >= scrollEnd) {
        scrollProgress = 1
      } else {
        scrollProgress = (scrollTop - scrollStart) / scrollableRange
      }

      const topPosition = scrollProgress * maxTravel

      contentElement.style.setProperty('--scroll-indicator-top', `${topPosition}px`)
      contentElement.style.setProperty('--scroll-indicator-transform', 'translateY(0)')
    }

    // Initial position
    handleScroll()

    contentElement.addEventListener('scroll', handleScroll)
    return () => contentElement.removeEventListener('scroll', handleScroll)
  }, [sections])

  return (
    <div className="preview-area">
      {/* Header with back arrow and instructional text */}
      <div className="preview-area__header">
        <button
          type="button"
          className="preview-area__back"
          onClick={onPageBack}
          aria-label="Back to previous page"
        >
          ‹
        </button>
        <div className="preview-area__intro">
          <h2 className="preview-area__title">Preview</h2>
          <p className="preview-area__subtitle">
            Please complete all required fields before continuing (not included work experience).<br />
            You won't be able to move to the next step until everything is filled out.
          </p>
        </div>
      </div>

      {/* Content area containing the cards. This element is scrollable */}
      <div className="preview-area__content" ref={contentRef}>
        {about && (
          <AboutSection
            title={about.title}
            content={about.content}
            complete={about.complete}
          />
        )}
        {education && (
          <EducationSection
            title={education.title}
            content={education.content}
            complete={education.complete}
            isCollapsed={isEducationCollapsed}
            onToggle={onToggleEducation}
          />
        )}
        {/* Row containing skills and communication side by side */}
        <div className="preview-area__row">
          {skills && (
            <SkillsSection
              title={skills.title}
              content={skills.content}
              complete={skills.complete}
            />
          )}
          {communication && (
            <CommunicationSection
              title={communication.title}
              content={communication.content}
              complete={communication.complete}
              onAddLink={onAddLink}
            />
          )}
        </div>
        {experience && (
          <ExperienceSection
            title={experience.title}
            content={experience.content}
            complete={experience.complete}
          />
        )}
      </div>

      {/* Footer navigation bar with undo/redo and next */}
      <div className="preview-area__footer">
        <div className="preview-area__controls">
          <div className="preview-area__history">
            <button
              type="button"
              className="preview-area__history-btn preview-area__history-btn--undo"
              onClick={onUndo}
              disabled={!undoAvailable}
              aria-disabled={!undoAvailable || undefined}
              aria-label="Undo"
            />
            <button
              type="button"
              className="preview-area__history-btn preview-area__history-btn--redo"
              onClick={onRedo}
              disabled={!redoAvailable}
              aria-disabled={!redoAvailable || undefined}
              aria-label="Redo"
            />
          </div>
          <button
            type="button"
            className="preview-area__next"
            onClick={isNextEnabled ? onNext : undefined}
            disabled={!isNextEnabled}
            aria-disabled={!isNextEnabled || undefined}
          >
            <span className="preview-area__next-text">Next</span>
            <span className="preview-area__next-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default PreviewAreaView