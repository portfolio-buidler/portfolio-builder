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
  onFileSelect: (file: File) => void
  onDropFile: (file: File) => void
  // Parent-provided upload progress for child display
  progress?: import('./UplaodArea/UploadArea.types').UploadProgressData
  status: import('./UplaodArea/UploadArea.types').UploadStatus
  errorMessage?: string
  onStatusChange?: (status: import('./UplaodArea/UploadArea.types').UploadStatus, errorMessage?: string) => void
  onRetry: () => void
}
