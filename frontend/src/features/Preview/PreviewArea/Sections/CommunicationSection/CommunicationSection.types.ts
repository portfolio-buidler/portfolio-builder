import type { ReactNode } from 'react'

export interface CommunicationSectionProps {
  title: string
  content: ReactNode
  complete?: boolean
  onAddLink: () => void
}
