import React from 'react'
import type { CommunicationSectionProps } from './CommunicationSection.types'

export const CommunicationSection: React.FC<CommunicationSectionProps> = ({
  title,
  content,
  complete,
  onAddLink,
}) => {
  return (
    <section
      className="preview-section preview-section--communication"
      data-complete={complete ?? true}
    >
      <h3 className="preview-section__title">{title}</h3>
      <div className="preview-section__content">
        {content}
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
  )
}

export default CommunicationSection
