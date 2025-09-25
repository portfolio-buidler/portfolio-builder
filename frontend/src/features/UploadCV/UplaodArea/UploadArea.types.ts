export interface UploadAreaProps {
  onFileSelect: (file: File) => void
  onDropFile: (file: File) => void
}

export interface UploadAreaViewProps {
  accept: string
  dragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onClick: () => void
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}
