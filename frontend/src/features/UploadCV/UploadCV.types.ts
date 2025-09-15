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
