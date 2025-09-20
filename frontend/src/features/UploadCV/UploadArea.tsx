import { useState } from 'react'
import type { UploadAreaProps } from './UploadArea.types'
import { validateFile, ALLOWED_MIME_TYPES } from '../../utils/fileValidation'
import { toast } from 'react-toastify'
import { UploadAreaView } from './UploadArea.view'

function UploadArea({ onFileSelect, onDropFile }: UploadAreaProps) {
  const [dragOver, setDragOver] = useState(false)
  const accept = ALLOWED_MIME_TYPES.join(',')

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      const validation = validateFile(file)
      if (validation.ok) {
        onDropFile(file)
      } else {
        toast.error(validation.error)
      }
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      const validation = validateFile(file)
      if (validation.ok) {
        onFileSelect(file)
      } else {
        toast.error(validation.error)
      }
    }
  }

  const handleClick = () => {
    document.getElementById('file-input')?.click()
  }

  return (
    <UploadAreaView
      accept={accept}
      dragOver={dragOver}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onFileInputChange={handleFileInputChange}
    />
  )
}

export default UploadArea
