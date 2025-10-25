import type { ReactNode } from 'react'

/** A single bullet line under an entry. */
export interface EntryBullet {
  text: string
}

/**
 * Generic entry structure for Education, Experience, Projects.
 * - field1: Degree | Position | Project Name
 * - field2: University | Company | Technology/Role
 * - years: (date range)
 */
export interface Entry {
  field1: string // primary field (e.g., Degree, Position, Project Name)
  field2: string // secondary field (e.g., University, Company, Technology)
  years: string  // date range
  bullets: EntryBullet[]
}

/** Configuration for field names (used in placeholders/labels) */
export interface FieldLabels {
  field1: string // e.g., "Degree", "Position", "Project Name"
  field2: string // e.g., "University", "Company", "Technology"
  years: string  // e.g., "years", "dates"
}

/** Container props */
export interface CollapsibleSectionProps {
  title: string
  content?: string
  fieldLabels: FieldLabels // Defines what field1/field2/years mean
  className?: string
  complete?: boolean
  isEditing?: boolean
  isExpanded?: boolean
  onToggleExpanded?: (next: boolean) => void
  onEditStart?: () => void
  onEditEnd?: (payload: { content: string; entries: Entry[]; savedExpandedHeight: number }) => void
  onContentChange?: (next: string) => void
}

/** View props */
export interface CollapsibleSectionViewProps {
  title: string
  className?: string
  fieldLabels: FieldLabels
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
  entries: Entry[]
  children?: ReactNode
}
