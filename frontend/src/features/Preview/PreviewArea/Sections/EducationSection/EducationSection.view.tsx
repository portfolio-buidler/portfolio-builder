import React from 'react'
import type { EducationSectionProps } from './EducationSection.types'

export const EducationSection: React.FC<EducationSectionProps> = ({
  title,
  content,
  complete,
  isCollapsed,
  onToggle,
}) => {
  return (
    <section
      className="preview-section preview-section--education"
      data-complete={complete ?? true}
    >
      <h3 className="preview-section__title">{title}</h3>
      {!isCollapsed && (
        <div className="preview-section__content">{content}</div>
      )}
      <button
        type="button"
        className="preview-section__toggle"
        onClick={onToggle}
        aria-label={isCollapsed ? 'Expand education section' : 'Collapse education section'}
      >
        {isCollapsed ? '▼' : '▲'}
      </button>
    </section>
  )
}

export default EducationSection
