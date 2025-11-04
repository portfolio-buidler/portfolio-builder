// SkillsSection.types.ts

/**
 * Skills data structure
 */
export interface SkillsData {
  languages: string[]
  technologies: string[]
}

/**
 * Props for SkillsSection container component
 */
export interface SkillsSectionProps {
  title: string
  complete?: boolean
  skillsData: SkillsData
  onSkillsDataChange: (data: SkillsData) => void
  isExpanded?: boolean
  onToggleExpanded?: (next: boolean) => void
}

/**
 * Props for SkillsSectionView presentation component
 */
export interface SkillsSectionViewProps {
  title: string
  complete?: boolean
  languages: string[]
  technologies: string[]
  
  // UI state
  selectedItem: { type: 'language' | 'technology', index: number } | null
  editingItem: { type: 'language' | 'technology', index: number } | null
  editValue: string
  inputRef: React.RefObject<HTMLInputElement>
  contentRef: React.RefObject<HTMLDivElement>
  
  // Callbacks
  onAddLanguage: () => void
  onAddTechnology: () => void
  onDoubleClick: (type: 'language' | 'technology', index: number) => void
  onEditValueChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onRemove: () => void
  
  // Collapsible props
  isExpanded?: boolean
  onToggleExpanded?: () => void
}