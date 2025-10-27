// PreviewArea.types.ts
import type { ReactNode } from 'react'

/**
 * Section data model for preview page.
 * Content type varies by section:
 * - 'about' and 'education': string (editable text)
 * - 'skills', 'communication', 'experience': ReactNode (structured JSX)
 */
export interface PreviewSection {
  id: string
  title: string
  content: string | ReactNode | null
  required?: boolean
  complete?: boolean
}

/**
 * Skills data structure
 */
export interface SkillsData {
  languages: string[]
  technologies: string[]
}

/**
 * Communication data structure
 */
export interface CommunicationData {
  mobile: string | null
  email: string | null
  links: string[]
}

/**
 * Container component props (currently no props needed)
 */
export interface PreviewAreaProps {}

/**
 * View component props
 */
export interface PreviewAreaViewProps {
  sections: PreviewSection[]
  
  // Navigation
  onPageBack: () => void
  onNext: () => void
  isNextEnabled: boolean
  
  // History (undo/redo)
  onUndo: () => void
  onRedo: () => void
  undoAvailable: boolean
  redoAvailable: boolean
  
  // Education section specific
  onToggleEducation: () => void
  isEducationExpanded: boolean
  
  // Skills section specific
  onToggleSkills: () => void
  isSkillsExpanded: boolean
  
  // Communication section specific
  onToggleCommunication: () => void
  isCommunicationExpanded: boolean
  
  // Edit mode
  editingSectionId: string | null
  onEditSectionStart: (sectionId: string) => void
  onEditSectionEnd: () => void
  onSectionContentChange: (sectionId: string, content: string) => void

  // Skills section - simplified
  skillsData: SkillsData
  onSkillsDataChange: (data: SkillsData) => void
  isSkillsComplete: boolean
  
  // Communication section - simplified
  communicationData: CommunicationData
  onCommunicationDataChange: (data: CommunicationData) => void
  isCommunicationComplete: boolean
}