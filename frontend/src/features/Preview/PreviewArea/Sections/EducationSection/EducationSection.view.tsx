import React from 'react'
import type { EducationSectionViewProps } from './EducationSection.types'
import './EducationSection.styles.scss'

/**
 * Presentational component for the Education section.
 * Renders view mode or edit mode based on isEditing prop.
 * 
 * View Mode: Displays parsed structured content (degree, university, years, bullets)
 * Edit Mode: Shows single textarea with raw content
 */
export const EducationSectionView = React.forwardRef<HTMLElement, EducationSectionViewProps>(
  (
    {
      title,
      content,
      parsedContent,
      complete,
      isExpanded,
      onToggle,
      isEditing,
      onSectionClick,
      onContentChange,
      onTextareaRef,
      onKeyDown,
    },
    ref
  ) => {
    return (
      <section
        ref={ref}
        className="preview-section preview-section--education education-section"
        data-complete={complete ?? true}
        data-expanded={isExpanded ?? false}
        data-editing={isEditing ?? false}
        onDoubleClick={isEditing ? undefined : onSectionClick}
      >
        <div className="preview-section__title-container">
          <h3 className="preview-section__title">{title}</h3>
        </div>
        <div className="education__content">
          {isEditing ? (
            <textarea
              ref={onTextareaRef}
              className="education__textarea"
              value={content}
              onChange={onContentChange}
              onKeyDown={onKeyDown}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              placeholder="Add your degree, university name, and graduation years."
            />
          ) : content.trim() ? (
            <div className="education__parsed-content">
              <p className="education__degree">{parsedContent.degree}</p>
              <p className="education__university">{parsedContent.university}</p>
              <p className="education__years">{parsedContent.years}</p>
              {parsedContent.bulletPoints.length > 0 && (
                <ul className="education__bullets">
                  {parsedContent.bulletPoints.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="education__placeholder">
              Add your degree, university name, and graduation years.
            </p>
          )}
        </div>
        <button
          type="button"
          className="preview-section__toggle"
          onClick={(e) => {
            e.stopPropagation() // CRITICAL: Prevent triggering edit mode
            onToggle?.()
          }}
          aria-label={isExpanded ? 'Collapse education' : 'Expand education'}
          aria-expanded={isExpanded}
        />
      </section>
    )
  }
)

EducationSectionView.displayName = 'EducationSectionView'

export default EducationSectionView
