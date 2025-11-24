import React from 'react'
import { CollapsibleSection } from '../shared/CollapsibleSection'
import type { CollapsibleSectionProps } from '../shared/CollapsibleSection'
import './ExperienceSection.styles.scss'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ExperienceSectionProps extends Omit<CollapsibleSectionProps, 'fieldLabels'> {
  // Experience-specific props can be added here if needed
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = (props) => {
  const fieldLabels = {
    field1: 'Position',
    field2: 'Company',
    years: 'years'
  }

  return (
    <CollapsibleSection
      {...props}
      fieldLabels={fieldLabels}
      className="preview-section--experience experience-section"
      title={props.title ?? 'Experience'}
    />
  )
}

export default ExperienceSection
