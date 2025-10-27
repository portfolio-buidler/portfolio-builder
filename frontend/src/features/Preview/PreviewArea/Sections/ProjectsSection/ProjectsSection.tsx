
import React from 'react'
import { CollapsibleSection } from '../shared/CollapsibleSection'
import type { CollapsibleSectionProps } from '../shared/CollapsibleSection'
import './ProjectsSection.styles.scss'

export interface ProjectsSectionProps extends Omit<CollapsibleSectionProps, 'fieldLabels'> {
  // Projects-specific props can be added here if needed
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = (props) => {
  const fieldLabels = {
    field1: 'Project Name',
    field2: 'Technology',
    years: 'dates'
  }

  return (
    <CollapsibleSection
      {...props}
      fieldLabels={fieldLabels}
      className="preview-section--projects projects-section"
      title={props.title ?? 'Projects'}
    />
  )
}

export default ProjectsSection
