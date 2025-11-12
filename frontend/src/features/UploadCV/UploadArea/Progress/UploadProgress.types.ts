export interface UploadProgressProps {
  fileName: string
  fileSizeBytes: number
  uploadedBytes: number
  totalBytes: number
  percent: number
  etaSeconds?: number | null
}

// View-only props with preformatted strings
export interface UploadProgressViewProps {
  fileName: string
  sizeText: string
  timeLeftText: string
  percent: number
  onCancel: () => void
}
