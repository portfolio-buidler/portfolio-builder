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
  
  // Edit mode
  editingSectionId: string | null
  onEditSectionStart: (sectionId: string) => void
  onEditSectionEnd: () => void
  onSectionContentChange: (sectionId: string, content: string) => void

    // Skills section specific
  skillsData: SkillsData
  onAddLanguage: () => void
  onAddTechnology: () => void
  onRemoveLanguage: (index: number) => void
  onRemoveTechnology: (index: number) => void
  isSkillsComplete: boolean
  
  // Communication section specific
  communicationData: CommunicationData
  onAddMobile: () => void
  onAddEmail: () => void
  onAddLink: () => void
  onRemoveMobile: () => void
  onRemoveEmail: () => void
  onRemoveLink: (index: number) => void
  isCommunicationComplete: boolean
}
