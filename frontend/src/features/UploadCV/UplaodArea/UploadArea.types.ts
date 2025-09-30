export interface UploadProgressData {
  fileName: string
  fileSizeBytes: number
  uploadedBytes: number
  totalBytes: number
  percent: number
  etaSeconds?: number | null
}

export interface UploadAreaProps {
  onFileSelect: (file: File) => void
  onDropFile: (file: File) => void
  /** When true, show the progress UI instead of instructions */
  isUploading?: boolean
  /** Progress data to render in the progress UI */
  progress?: UploadProgressData
  /** Allow cancel from the progress UI */
  onCancelUpload?: () => void
}

export interface UploadAreaViewProps {
  accept: string
  dragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onClick: () => void
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  isUploading?: boolean
  progress?: UploadProgressData
  onCancelUpload?: () => void
}
