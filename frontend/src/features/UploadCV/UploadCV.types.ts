export interface UploadFile {
  file: File
  name: string
  size: number
  type: string
}

export interface UploadResponse {
  success: boolean
  message: string
  data?: {
    fileId: string
    extractedData?: any
  }
  error?: string
}

export interface UploadAreaProps {
  onFileSelect: (file: File) => void
  onDropFile: (file: File) => void
}


export interface UploadCVViewProps {
  backgroundUrl: string
  ready: boolean
  isUploading: boolean
  onUpload: () => void
  onNext: () => void // ✅ New: Called when user clicks Next after success
  onFileSelect: (file: File) => void
  onDropFile: (file: File) => void
  progress?: import('./UploadArea/UploadArea.types').UploadProgressData
  status: import('./UploadArea/UploadArea.types').UploadStatus
  errorMessage?: string
  onStatusChange?: (status: import('./UploadArea/UploadArea.types').UploadStatus, errorMessage?: string) => void
  onRetry: () => void
  user: import('../../services/Auth.types').User | null
  onLogin: () => void
  onRegister: () => void
  onLogout?: () => void
}