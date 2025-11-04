// CommunicationSection.types.ts

/**
 * Communication data structure
 */
export interface CommunicationData {
  mobile: string | null
  email: string | null
  links: string[]
}

/**
 * Props for CommunicationSection container component
 */
export interface CommunicationSectionProps {
  title: string
  complete?: boolean
  communicationData: CommunicationData
  onCommunicationDataChange: (data: CommunicationData) => void
  isExpanded?: boolean
  onToggleExpanded?: (next: boolean) => void
}

/**
 * Props for CommunicationSectionView presentation component
 */
export interface CommunicationSectionViewProps {
  title: string
  complete?: boolean
  mobile: string | null
  email: string | null
  links: string[]
  
  // UI state
  selectedItem: { type: 'mobile' | 'email' | 'link', index?: number } | null
  editingItem: { type: 'mobile' | 'email' | 'link', index?: number } | null
  editValue: string
  inputRef: React.RefObject<HTMLInputElement>
  contentRef: React.RefObject<HTMLDivElement>
  
  // Callbacks
  onAddMobile: () => void
  onAddEmail: () => void
  onAddLink: () => void
  onDoubleClick: (type: 'mobile' | 'email' | 'link', index?: number) => void
  onEditValueChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onRemove: () => void
  
  // Collapsible props
  isExpanded?: boolean
  onToggleExpanded?: () => void
}