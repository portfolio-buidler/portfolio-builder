export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  fullName: string
  createdAt: string
}

export interface PreviewProps {
  backgroundUrl?: string
}

export interface PreviewViewProps {
  backgroundUrl: string
  previewArea?: React.ReactNode
  user: User | null
  onLogin: () => void
  onRegister: () => void
  onLogout?: () => void
}