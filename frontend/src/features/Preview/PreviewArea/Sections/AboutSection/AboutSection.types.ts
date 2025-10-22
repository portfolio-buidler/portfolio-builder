import type { ReactNode } from 'react'

export interface AboutSectionProps {
  title: string
  content: ReactNode
  complete?: boolean
  isEditing?: boolean
  onEditStart?: () => void
  onEditEnd?: () => void
  onContentChange?: (content: string) => void
}

export interface AboutSectionViewProps {
  title: string
  content: ReactNode
  complete?: boolean
  isEditing?: boolean
  editableContent: string
  onSectionDoubleClick: () => void
  onTextChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  onTextareaRef: (textarea: HTMLTextAreaElement | null) => void
}
