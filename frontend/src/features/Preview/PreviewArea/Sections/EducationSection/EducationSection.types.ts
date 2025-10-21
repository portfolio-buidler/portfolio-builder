import type { ReactNode } from 'react'

/**
 * Parsed education content structure.
 * Content is parsed from raw string format into structured data.
 */
export interface ParsedEducationContent {
  degree: string
  university: string
  years: string
  bulletPoints: string[]
}

/**
 * Props for the Education section smart container.
 */
export interface EducationSectionProps {
  title: string
  content: ReactNode
  complete?: boolean
  isExpanded?: boolean
  onToggle?: () => void
  isEditing?: boolean
  onEditStart?: () => void
  onEditEnd?: () => void
  onContentChange?: (content: string) => void
}

/**
 * Props for the Education section presentational view.
 */
export interface EducationSectionViewProps {
  title: string
  content: string
  parsedContent: ParsedEducationContent
  complete?: boolean
  isExpanded?: boolean
  onToggle?: () => void
  isEditing?: boolean
  onSectionClick: () => void
  onContentChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  onTextareaRef: (textarea: HTMLTextAreaElement | null) => void
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void
}
