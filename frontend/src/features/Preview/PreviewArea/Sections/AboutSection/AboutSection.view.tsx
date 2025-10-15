import React from 'react'
import type { AboutSectionProps } from './AboutSection.types'

export const AboutSection: React.FC<AboutSectionProps> = ({ title, content, complete }) => {
  return (
    <section
      className="preview-section preview-section--about"
      data-complete={complete ?? true}
    >
      <h3 className="preview-section__title">{title}</h3>
      <div className="preview-section__content">{content}</div>
    </section>
  )
}

export default AboutSection
