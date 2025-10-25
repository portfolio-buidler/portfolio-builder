/**
 * ExperienceSection.tsx
 * 
 * Experience section wrapper that uses the shared CollapsibleSection component.
 * Configures field labels specific to work experience entries.
 * 
 * Responsibilities:
 * - Configure field labels: "Position", "Company", "years"
 * - Pass through props to CollapsibleSection
 * - Apply experience-specific class name
 */

import React from 'react'
import { CollapsibleSection } from '../shared/CollapsibleSection'
import type { CollapsibleSectionProps } from '../shared/CollapsibleSection'
import './ExperienceSection.styles.scss'

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
