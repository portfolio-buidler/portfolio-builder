/**
 * PreviewArea.view.tsx
 * 
 * Presentational component for the CV preview area.
 * Follows Logic-View-Style separation pattern.
 * 
 * Architecture:
 * - Pure view layer - no business logic
 * - Receives all data and callbacks as props
 * - Renders sections in specified layout
 * - Manages scroll indicator positioning
 * 
 * Layout:
 * - Header: Back button + title + instructions
 * - Content: Scrollable area with sections
 * - Footer: Undo/Redo + Next button
 */

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

  /* ========================================================================
     SCROLL INDICATOR LOGIC
     Updates CSS custom properties to position the scroll indicator line
     between the About section (top anchor) and Experience section (bottom)
     ======================================================================== */

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

      const aboutEl = getSectionEl('about')
      const experienceEl = getSectionEl('experience')

      // Fallback to center if sections not found
      if (!aboutEl || !experienceEl) {
        contentElement.style.setProperty('--scroll-indicator-top', '50%')
        contentElement.style.setProperty('--scroll-indicator-transform', 'translateY(-50%)')
        return
      }

      const aboutTop = aboutEl.offsetTop
      const experienceBottom = experienceEl.offsetTop + experienceEl.offsetHeight
      const scrollStart = aboutTop
      const scrollEnd = experienceBottom - clientHeight
      const scrollableRange = scrollEnd - scrollStart

      // Center the line if not enough scrollable content
      if (scrollableRange <= 0) {
        contentElement.style.setProperty('--scroll-indicator-top', '50%')
        contentElement.style.setProperty('--scroll-indicator-transform', 'translateY(-50%)')
        return
      }

      // Calculate scroll progress (0 = at start, 1 = at end)
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

    handleScroll()
    contentElement.addEventListener('scroll', handleScroll)
    return () => contentElement.removeEventListener('scroll', handleScroll)
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
            content={experience.content}
            complete={experience.complete}
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