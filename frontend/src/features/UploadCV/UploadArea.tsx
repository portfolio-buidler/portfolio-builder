import { useState } from 'react'
import type { UploadAreaProps } from './UploadCV.types'

function UploadArea({ onFileSelect, onDropFile }: UploadAreaProps) {
  const [dragOver, setDragOver] = useState(false)
  const [focused, setFocused] = useState(false)

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
      // Validate file type and size
      if (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        if (file.size <= 2 * 1024 * 1024) { // 2MB limit
          onDropFile(file)
        }
      }
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      onFileSelect(file)
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
        relative rounded-2xl backdrop-blur-md bg-white/20 border border-white/30
        flex flex-col items-center justify-center cursor-pointer transition-all duration-300
        ${dragOver ? 'bg-white/30 scale-105' : 'hover:bg-white/25'}
        ${focused ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
      `}
      style={{
        width: '616px',
        height: '346px'
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-input')?.click()}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      tabIndex={0}
      role="button"
      aria-label="Upload CV file by clicking or dragging and dropping. Accepts PDF and DOCX files up to 2MB."
    >
      {/* Scroll Icon */}
      <div className="text-6xl mb-4">📜</div>
      
      {/* Upload Text */}
      <p className="text-gray-700 font-medium text-lg">
        Upload Or Drag Your CV
      </p>
      
      {/* Hidden File Input */}
      <input
        id="file-input"
        type="file"
        accept=".pdf,.docx"
        onChange={handleFileInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="hidden"
        aria-describedby="upload-instructions"
      />
      
      {/* Screen reader instructions */}
      <div id="upload-instructions" className="sr-only">
        Upload your CV in PDF or DOCX format. Maximum file size is 2MB. You can click to browse files or drag and drop a file here.
      </div>
    </div>
  )
}

export default UploadArea
