import React from 'react'
import type { SkillsSectionProps } from './SkillsSection.types'
import questionMarkIcon from '../../../../../assets/icons/PreviewPage/question-mark.svg'

export const SkillsSection: React.FC<SkillsSectionProps> = ({ title, content, complete }) => {
  return (
    <section
      className="preview-section preview-section--skills"
      data-complete={complete ?? true}
    >
      <div className="preview-section__title-container">
        <h3 className="preview-section__title">{title}</h3>
        <img 
          src={questionMarkIcon} 
          alt="Help" 
          className="preview-section__help-icon"
        />
      </div>
      <div className="preview-section__content">{content}</div>
    </section>
  )
}

export default SkillsSection
