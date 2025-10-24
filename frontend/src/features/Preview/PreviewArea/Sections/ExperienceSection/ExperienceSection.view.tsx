import React from 'react'
import type { ExperienceSectionProps } from './ExperienceSection.types'
import questionMarkIcon from '../../../../../assets/icons/PreviewPage/question-mark.svg'

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({ title, content, complete }) => {
  return (
    <section
      className="preview-section preview-section--experience"
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

export default ExperienceSection
