import type { ReactNode } from 'react'

/** A single bullet line under an education entry. */
export interface EducationBullet {
  text: string
}

/** A single education entry. */
export interface EducationEntry {
  degree: string
  university: string
  years: string
  bullets: EducationBullet[]
}

/** Container props */
export interface EducationSectionProps {
  title?: string
  content?: string
  complete?: boolean
  isEditing?: boolean
  isExpanded?: boolean
  onToggleExpanded?: (next: boolean) => void
  onEditStart?: () => void
  onEditEnd?: (payload: { content: string; entries: EducationEntry[]; savedExpandedHeight: number }) => void
  onContentChange?: (next: string) => void
  className?: string
}

/** View props */
export interface EducationSectionViewProps {
  title?: string
  isEditing: boolean
  isExpanded: boolean
  savedExpandedHeight: number
  onEnterEdit: () => void
  onToggle: () => void
  editValue: string
  onEditChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onEditKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  contentRef: React.RefObject<HTMLDivElement>
  textareaRef: React.RefObject<HTMLTextAreaElement>
  entries: EducationEntry[]
  children?: ReactNode
}
