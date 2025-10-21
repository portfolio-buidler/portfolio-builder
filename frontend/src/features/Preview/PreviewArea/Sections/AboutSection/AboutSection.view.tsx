import React from 'react'
import type { AboutSectionViewProps } from './AboutSection.types'
import './AboutSection.styles.scss'

/**
 * Presentational component for the About section.
 * Renders view mode or edit mode based on isEditing prop.
 */
export const AboutSectionView = React.forwardRef<HTMLElement, AboutSectionViewProps>(
  (
    {
      title,
      content,
      complete,
      isEditing,
      editableContent,
      onSectionClick,
      onTextChange,
      onTextareaRef,
    },
    ref
  ) => {
    return (
      <section
        ref={ref}
        className="preview-section preview-section--about"
        data-complete={complete ?? true}
        data-editing={isEditing ?? false}
        onClick={onSectionClick}
      >
        <div className="preview-section__title-container">
          <h3 className="preview-section__title">{title}</h3>
        </div>
        <div className="preview-section__content">
          {isEditing ? (
            <textarea
              ref={onTextareaRef}
              className="preview-section__textarea"
              value={editableContent}
              onChange={onTextChange}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            content
          )}
        </div>
      </section>
    )
  }
)

AboutSectionView.displayName = 'AboutSectionView'

export default AboutSectionView
