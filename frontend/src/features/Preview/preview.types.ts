import type { User } from '../../services/Auth.types'

export interface PreviewProps {
  backgroundUrl?: string;
}

export interface PreviewViewProps {
  backgroundUrl: string;
  previewArea?: React.ReactNode;
  // Auth props
  user: User | null;
  onLogout: () => void;
}