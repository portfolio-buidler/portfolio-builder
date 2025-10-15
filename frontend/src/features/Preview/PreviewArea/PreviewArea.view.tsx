import React from 'react'
import type { PreviewAreaViewProps, PreviewSection } from './PreviewArea.types'
import './PreviewArea.styles.scss'

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
  // Extract specific sections by id for layout
  const about = sections.find((s) => s.id === 'about')
  const education = sections.find((s) => s.id === 'education')
  const skills = sections.find((s) => s.id === 'skills')
  const communication = sections.find((s) => s.id === 'communication')
  const experience = sections.find((s) => s.id === 'experience')

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
      <div className="preview-area__content">
        {about && (
          <section
            className="preview-section preview-section--about"
            data-complete={about.complete ?? true}
          >
            <h3 className="preview-section__title">{about.title}</h3>
            <div className="preview-section__content">{about.content}</div>
          </section>
        )}
        {education && (
          <section
            className="preview-section preview-section--education"
            data-complete={education.complete ?? true}
          >
            {/* Title always visible at the top of the education card */}
            <h3 className="preview-section__title">{education.title}</h3>
            {/* Render content only when the section is expanded */}
            {!isEducationCollapsed && (
              <div className="preview-section__content">{education.content}</div>
            )}
            {/* Collapse/expand toggle button positioned at the bottom right */}
            <button
              type="button"
              className="preview-section__toggle"
              onClick={onToggleEducation}
              aria-label={isEducationCollapsed ? 'Expand education section' : 'Collapse education section'}
            >
              {isEducationCollapsed ? '▼' : '▲'}
            </button>
          </section>
        )}
        {/* Row containing skills and communication side by side */}
        <div className="preview-area__row">
          {skills && (
            <section
              className="preview-section preview-section--skills"
              data-complete={skills.complete ?? true}
            >
              <h3 className="preview-section__title">{skills.title}</h3>
              <div className="preview-section__content">{skills.content}</div>
            </section>
          )}
          {communication && (
            <section
              className="preview-section preview-section--communication"
              data-complete={communication.complete ?? true}
            >
              <h3 className="preview-section__title">{communication.title}</h3>
              <div className="preview-section__content">
                {communication.content}
                <button
                  type="button"
                  className="preview-section__add-link"
                  onClick={onAddLink}
                  aria-label="Add communication link"
                >
                  +
                </button>
              </div>
            </section>
          )}
        </div>
        {experience && (
          <section
            className="preview-section preview-section--experience"
            data-complete={experience.complete ?? true}
          >
            <h3 className="preview-section__title">{experience.title}</h3>
            <div className="preview-section__content">{experience.content}</div>
          </section>
        )}
      </div>

      {/* Footer navigation bar with undo/redo and next */}
      <div className="preview-area__footer">
        <div className="preview-area__history">
          <button
            type="button"
            className="preview-area__history-btn"
            onClick={onUndo}
            disabled={!undoAvailable}
            aria-disabled={!undoAvailable || undefined}
            aria-label="Undo"
          >
            ‹
          </button>
          <button
            type="button"
            className="preview-area__history-btn"
            onClick={onRedo}
            disabled={!redoAvailable}
            aria-disabled={!redoAvailable || undefined}
            aria-label="Redo"
          >
            ›
          </button>
        </div>
        <button
          type="button"
          className="preview-area__next"
          onClick={isNextEnabled ? onNext : undefined}
          disabled={!isNextEnabled}
          aria-disabled={!isNextEnabled || undefined}
        >
          Next
          <span className="preview-area__next-icon">›</span>
        </button>
      </div>
    </div>
  )
}

export default PreviewAreaView