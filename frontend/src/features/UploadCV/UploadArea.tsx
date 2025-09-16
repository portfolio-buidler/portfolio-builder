import { useState } from 'react'
import type { UploadAreaProps } from './UploadCV.types'
import { validateFile, ALLOWED_MIME_TYPES } from '../../utils/fileValidation'
import { toast } from 'react-toastify'

function UploadArea({ onFileSelect, onDropFile }: UploadAreaProps) {
  const [dragOver, setDragOver] = useState(false)
  const [focused, setFocused] = useState(false)
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      document.getElementById('file-input')?.click()
    }
  }

  const handleFocus = () => setFocused(true)
  const handleBlur = () => setFocused(false)

  return (
    <div
      className={`
        relative w-96 h-64 rounded-2xl backdrop-blur-md bg-white/20 border border-white/30
        flex flex-col items-center justify-center cursor-pointer transition-all duration-300
        ${dragOver ? 'bg-white/30 scale-105' : 'hover:bg-white/25'}
        ${focused ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-input')?.click()}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      tabIndex={0}
      role="button"
      aria-label="Upload CV file by clicking or dragging and dropping. Allowed types: PDF, DOCX, PNG, JPEG. Maximum size 5MB."
    >
      {/* Box Icon */}
      <div className="text-6xl mb-4">📦</div>
      
      {/* Upload Text */}
      <p className="text-gray-700 font-medium text-lg">
        Upload Or Drag Your CV
      </p>
      
      {/* Hidden File Input */}
      <input
        id="file-input"
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="hidden"
        aria-describedby="upload-instructions"
      />
      
      {/* Screen reader instructions */}
      <div id="upload-instructions" className="sr-only">
        Upload your CV in PDF, DOCX, PNG or JPEG format. Maximum file size is 5MB. You can click to browse files or drag and drop a file here.
      </div>
    </div>
  )
}

export default UploadArea
