import React from 'react'
import type { CollapsibleSectionViewProps } from './CollapsibleSection.types'
import './CollapsibleSection.styles.scss'
import questionMarkIcon from '../../../../../../assets/icons/PreviewPage/question-mark.svg'

export const CollapsibleSectionView = React.forwardRef<HTMLElement, CollapsibleSectionViewProps>(
  (
    {
      title,
      className,
      fieldLabels,
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

    // Generate placeholder text based on field labels
    const placeholderText = `Line 1: ${fieldLabels.field1} – ${fieldLabels.field2} – (${fieldLabels.years})\nLines 2+: - • * or 1.\n\nSeparate entries with a blank line.`
    const emptyPlaceholder = `Double-click to add ${title.toLowerCase()}. First line: ${fieldLabels.field1} – ${fieldLabels.field2} – (${fieldLabels.years}). Then bullets. Separate entries with a blank line.`

    return (
      <section
        ref={ref}
        className={`preview-section collapsible-section ${className}`}
        data-expanded={isExpanded}
        data-editing={isEditing}
        onDoubleClick={isEditing ? undefined : onEnterEdit}
        aria-label={`${title} section`}
      >
        <div className="preview-section__title-container">
          <h3 className="preview-section__title">{title}</h3>
          <img
            src={questionMarkIcon}
            alt="Help"
            className="preview-section__help-icon"
          />
        </div>

        <div
          ref={contentRef}
          className="collapsible-section__content"
          style={contentStyle}
        >
          {isEditing ? (
            <textarea
              ref={textareaRef}
              className="collapsible-section__textarea"
              value={editValue}
              onChange={onEditChange}
              onKeyDown={onEditKeyDown}
              placeholder={placeholderText}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : editValue.trim() ? (
            <div className="collapsible-section__free-text">{editValue}</div>
          ) : (
            <p className="collapsible-section__placeholder">
              {emptyPlaceholder}
            </p>
          )}
        </div>

        <button
          type="button"
          className="preview-section__toggle"
          onClick={(e) => { e.stopPropagation(); if (!isEditing) onToggle() }}
          aria-label={isExpanded ? `Collapse ${title.toLowerCase()}` : `Expand ${title.toLowerCase()}`}
          aria-expanded={isExpanded}
        />
      </section>
    )
  }
)

CollapsibleSectionView.displayName = 'CollapsibleSectionView'
export default CollapsibleSectionView
