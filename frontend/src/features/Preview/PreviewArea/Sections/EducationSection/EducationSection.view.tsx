import React from 'react'
import type { EducationSectionViewProps } from './EducationSection.types'
import './EducationSection.styles.scss'
import questionMarkIcon from '../../../../../assets/icons/PreviewPage/question-mark.svg'

/**
 * This view component respects your SCSS completely.
 * We only set inline maxHeight when:
 *   - NOT editing
 *   - Expanded
 * to animate toward the saved numeric height.
 * Collapsed state is 100% CSS-driven (max-height: 110px).
 */
export const EducationSectionView = React.forwardRef<HTMLElement, EducationSectionViewProps>(
  (
    {
      title,
      isEditing,
      isExpanded,
      savedExpandedHeight,
      onEnterEdit,
      onToggle,
      editValue,
      onEditChange,
      onEditKeyDown,
      contentRef,
      textareaRef,
    },
    ref
  ) => {
    // Inline style only when expanded in view mode. Otherwise let CSS drive it.
    const contentStyle = React.useMemo<React.CSSProperties>(() => {
      if (isEditing) return {}
      if (!isExpanded) return {}
      // Use the saved height if we have it and it's bigger than collapsed
      const h = Math.max(0, savedExpandedHeight | 0)
      if (h > 110) {
        return { maxHeight: `${h}px` }
      }
      // Otherwise let CSS handle it (max-height: none)
      return {}
    }, [isEditing, isExpanded, savedExpandedHeight])

    return (
      <section
        ref={ref}
        className="preview-section preview-section--education education-section"
        data-expanded={isExpanded}
        data-editing={isEditing}
        onDoubleClick={isEditing ? undefined : onEnterEdit}
        aria-label="Education section"
      >
        <div className="preview-section__title-container">
          <h3 className="preview-section__title">{title ?? 'Education'}</h3>
          <img
            src={questionMarkIcon}
            alt="Help"
            className="preview-section__help-icon"
          />
        </div>

        <div
          ref={contentRef}
          className="education__content"
          style={contentStyle}
        >
          {isEditing ? (
            <textarea
              ref={textareaRef}
              className="education__textarea"
              value={editValue}
              onChange={onEditChange}
              onKeyDown={onEditKeyDown}
              placeholder={`Line 1: Degree – University – (years)\nLines 2+: - • * or 1.\n\nSeparate entries with a blank line.`}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : editValue.trim() ? (
             <div className="education__free-text">{editValue}</div>
          ) : (
            <p className="education__placeholder">
              Double-click to add your education. First line: Degree – University – (years). Then bullets. Separate entries with a blank line.
            </p>
          )}
        </div>

        <button
          type="button"
          className="preview-section__toggle"
          onClick={(e) => { e.stopPropagation(); if (!isEditing) onToggle() }}
          aria-label={isExpanded ? 'Collapse education' : 'Expand education'}
          aria-expanded={isExpanded}
        />
      </section>
    )
  }
)

EducationSectionView.displayName = 'EducationSectionView'
export default EducationSectionView
