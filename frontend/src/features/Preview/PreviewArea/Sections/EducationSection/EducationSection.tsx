/**
 * EducationSection.tsx
 * 
 * Education section wrapper that uses the shared CollapsibleSection component.
 * Configures field labels specific to education entries.
 * 
 * Responsibilities:
 * - Configure field labels: "Degree", "University", "years"
 * - Pass through props to CollapsibleSection
 * - Apply education-specific class name
 */

import React from 'react'
import { CollapsibleSection } from '../shared/CollapsibleSection'
import type { CollapsibleSectionProps } from '../shared/CollapsibleSection'

export interface EducationSectionProps extends Omit<CollapsibleSectionProps, 'fieldLabels'> {
  // Education-specific props can be added here if needed
}

export const EducationSection: React.FC<EducationSectionProps> = (props) => {
  const fieldLabels = {
    field1: 'Degree',
    field2: 'University',
    years: 'years'
  }

  return (
    <CollapsibleSection
      {...props}
      fieldLabels={fieldLabels}
      className="preview-section--education education-section"
      title={props.title ?? 'Education'}
    />
  )
}

export default EducationSection

