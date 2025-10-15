import React from 'react'
import type { SkillsSectionProps } from './SkillsSection.types'

export const SkillsSection: React.FC<SkillsSectionProps> = ({ title, content, complete }) => {
  return (
    <section
      className="preview-section preview-section--skills"
      data-complete={complete ?? true}
    >
      <h3 className="preview-section__title">{title}</h3>
      <div className="preview-section__content">{content}</div>
    </section>
  )
}

export default SkillsSection
