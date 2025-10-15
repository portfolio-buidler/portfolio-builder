import type { ReactNode } from 'react'

export interface EducationSectionProps {
  title: string
  content: ReactNode
  complete?: boolean
  isCollapsed: boolean
  onToggle: () => void
}
