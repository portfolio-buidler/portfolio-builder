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
  content: string | ReactNode
  required?: boolean
  complete?: boolean
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
  
  // Communication section specific
  onAddLink: () => void
  
  // Edit mode
  editingSectionId: string | null
  onEditSectionStart: (sectionId: string) => void
  onEditSectionEnd: () => void
  onSectionContentChange: (sectionId: string, content: string) => void
}
