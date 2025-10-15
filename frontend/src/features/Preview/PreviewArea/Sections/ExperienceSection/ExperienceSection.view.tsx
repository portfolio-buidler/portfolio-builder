import React from 'react'
import type { ExperienceSectionProps } from './ExperienceSection.types'

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({ title, content, complete }) => {
  return (
    <section
      className="preview-section preview-section--experience"
      data-complete={complete ?? true}
    >
      <h3 className="preview-section__title">{title}</h3>
      <div className="preview-section__content">{content}</div>
    </section>
  )
}

export default ExperienceSection
