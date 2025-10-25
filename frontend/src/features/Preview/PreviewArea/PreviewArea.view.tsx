import React from 'react'
import type { PreviewAreaViewProps } from './PreviewArea.types'
import './PreviewArea.styles.scss'
import {
  AboutSection,
  EducationSection,
  SkillsSection,
  CommunicationSection,
  ExperienceSection,
  ProjectsSection,
} from './Sections'

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
  isEducationExpanded,
  onAddLink,
  editingSectionId,
  onEditSectionStart,
  onEditSectionEnd,
  onSectionContentChange,
}) => {
  const contentRef = React.useRef<HTMLDivElement>(null)

  /* ========================================================================
     SECTION DATA EXTRACTION
     ======================================================================== */

  const about = sections.find((s) => s.id === 'about')
  const education = sections.find((s) => s.id === 'education')
  const skills = sections.find((s) => s.id === 'skills')
  const communication = sections.find((s) => s.id === 'communication')
  const experience = sections.find((s) => s.id === 'experience')
  const projects = sections.find((s) => s.id === 'projects')

  /* ========================================================================
    SCROLL INDICATOR LOGIC
    Updates CSS custom properties to position the scroll indicator line
    between the About section (top anchor) and Projects section (bottom)
    (fallback to Experience if Projects is missing)
    
    Note: The actual scrolling happens on the parent preview__body container,
    not on preview-area__content. We need to access the parent scroll.
    ======================================================================== */

  React.useEffect(() => {
    const contentElement = contentRef.current
    if (!contentElement) return

    // The scroll happens on the parent container (preview__body)
    const scrollContainer = contentElement.closest('.preview__body') as HTMLElement | null
    if (!scrollContainer) return

    const getSectionEl = (sectionClass: string): HTMLElement | null =>
      contentElement.querySelector(`.preview-section--${sectionClass}`) as HTMLElement | null

    const handleScroll = () => {
      const aboutEl = getSectionEl('about')
      // Prefer projects as the bottom anchor; fall back to experience if needed
      const projectsEl = getSectionEl('projects')
      const experienceEl = getSectionEl('experience')
      const bottomAnchorEl = projectsEl || experienceEl

      // Hide indicator if sections not found
      if (!aboutEl || !bottomAnchorEl) {
        scrollContainer.style.setProperty('--scroll-indicator-opacity', '0')
        return
      }

      const lineHeight = 296
      const containerRect = scrollContainer.getBoundingClientRect()
      const aboutRect = aboutEl.getBoundingClientRect()
      const bottomAnchorRect = bottomAnchorEl.getBoundingClientRect()

      // Calculate when the About section reaches the top of the viewport
      const aboutTopInView = aboutRect.top
      // Calculate when the bottom anchor's bottom reaches the bottom of viewport
      const bottomAnchorBottomInView = bottomAnchorRect.bottom

      // Determine the scrollable range in viewport coordinates
      // Start: when About section top aligns with container top
      // End: when bottom anchor bottom aligns with container bottom
      const scrollStart = containerRect.top
      const scrollEnd = containerRect.bottom
      const viewportRange = scrollEnd - scrollStart - lineHeight

      // Calculate scroll progress based on the About section's position
      // When About is at container top: progress = 0
      // When bottom anchor bottom is at container bottom: progress = 1
      let scrollProgress = 0

      if (aboutTopInView >= scrollStart) {
        // About section hasn't reached the top yet
        scrollProgress = 0
      } else if (bottomAnchorBottomInView <= scrollEnd) {
        // Bottom anchor has passed the bottom
        scrollProgress = 1
      } else {
        // Calculate progress based on how far we've scrolled between start and end
        const totalScrollableContent = bottomAnchorBottomInView - aboutTopInView - lineHeight
        const scrolled = scrollStart - aboutTopInView
        scrollProgress = Math.max(0, Math.min(1, scrolled / totalScrollableContent))
      }

      // Calculate the indicator position in the viewport
      // It should move from containerRect.top to containerRect.bottom - lineHeight
      const indicatorTop = scrollStart + (scrollProgress * viewportRange)

      // Show indicator only when we're in the scrollable range
      const shouldShow = aboutTopInView < scrollStart && bottomAnchorBottomInView > scrollEnd
      
      scrollContainer.style.setProperty('--scroll-indicator-top', `${indicatorTop}px`)
      scrollContainer.style.setProperty('--scroll-indicator-opacity', shouldShow ? '1' : '0')
    }

    // Initial calculation with delay to ensure DOM is ready
    const initialTimeout = setTimeout(handleScroll, 100)
    
    // Listen to scroll events on the parent container
    scrollContainer.addEventListener('scroll', handleScroll)
    
    // Recalculate on window resize
    window.addEventListener('resize', handleScroll)
    
    // Observe DOM mutations to recalculate when content changes
    const observer = new MutationObserver(handleScroll)
    observer.observe(contentElement, { 
      childList: true, 
      subtree: true, 
      attributes: true,
      attributeFilter: ['data-editing', 'data-complete']
    })
    
    return () => {
      clearTimeout(initialTimeout)
      scrollContainer.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      observer.disconnect()
    }
  }, [sections])

  /* ========================================================================
     RENDER
     ======================================================================== */

  return (
    <div className="preview-area">
      {/* ====================================================================
          HEADER
          ==================================================================== */}
      <header className="preview-area__header">
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
            Please complete all required fields before continuing (not included work experience).
            <br />
            You won't be able to move to the next step until everything is filled out.
          </p>
        </div>
      </header>

      {/* ====================================================================
          CONTENT (Scrollable)
          ==================================================================== */}
      <div className="preview-area__content" ref={contentRef}>
        {/* About Section (editable) */}
        {about && (
          <AboutSection
            title={about.title}
            content={about.content}
            complete={about.complete}
            isEditing={editingSectionId === 'about'}
            onEditStart={() => onEditSectionStart('about')}
            onEditEnd={onEditSectionEnd}
            onContentChange={(content: string) => onSectionContentChange('about', content)}
          />
        )}

        {/* Education Section (editable + collapsible) */}
        {education && (
          <EducationSection
            title={education.title}
            content={typeof education.content === 'string' ? education.content : ''}
            complete={education.complete}
            isExpanded={isEducationExpanded}
            onToggleExpanded={onToggleEducation}
            isEditing={editingSectionId === 'education'}
            onEditStart={() => onEditSectionStart('education')}
            onEditEnd={onEditSectionEnd}
            onContentChange={(content: string) => onSectionContentChange('education', content)}
          />
        )}

        {/* Skills + Communication Row (side by side) */}
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

        {/* Experience Section */}
        {experience && (
          <ExperienceSection
            title={experience.title}
            content={typeof experience.content === 'string' ? experience.content : ''}
            complete={experience.complete}
          />
        )}

        {/* Projects Section */}
        {projects && (
          <ProjectsSection
            title={projects.title}
            content={typeof projects.content === 'string' ? projects.content : ''}
            complete={projects.complete}
          />
        )}
      </div>

      {/* ====================================================================
          FOOTER (Navigation)
          ==================================================================== */}
      <footer className="preview-area__footer">
        <div className="preview-area__controls">
          {/* Undo/Redo History Controls */}
          <div className="preview-area__history">
            <button
              type="button"
              className="preview-area__history-btn preview-area__history-btn--undo"
              onClick={onUndo}
              disabled={!undoAvailable}
              aria-disabled={!undoAvailable || undefined}
              aria-label="Undo last change"
            />
            <button
              type="button"
              className="preview-area__history-btn preview-area__history-btn--redo"
              onClick={onRedo}
              disabled={!redoAvailable}
              aria-disabled={!redoAvailable || undefined}
              aria-label="Redo last change"
            />
          </div>

          {/* Next Button */}
          <button
            type="button"
            className="preview-area__next"
            onClick={isNextEnabled ? onNext : undefined}
            disabled={!isNextEnabled}
            aria-disabled={!isNextEnabled || undefined}
            aria-label="Proceed to next step"
          >
            <span className="preview-area__next-text">Next</span>
            <span className="preview-area__next-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 6L15 12L9 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        </div>
      </footer>
    </div>
  )
}

export default PreviewAreaView