export interface CommunicationSectionProps {
  title: string
  complete?: boolean
  mobile: string | null
  email: string | null
  links: string[]
  onAddMobile: () => void
  onAddEmail: () => void
  onAddLink: () => void
  onRemoveMobile: () => void
  onRemoveEmail: () => void
  onRemoveLink: (index: number) => void
}
