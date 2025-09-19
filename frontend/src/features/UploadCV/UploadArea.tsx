import { useState } from 'react'
import type { UploadAreaProps } from './UploadCV.types'
import { validateFile, ALLOWED_MIME_TYPES } from '../../utils/fileValidation'
import { toast } from 'react-toastify'

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

  return (
    <div
      className={`
        relative w-[38.5rem] h-[20.75rem] rounded-2xl backdrop-blur-md bg-white/20 border border-white/30
        flex flex-col items-center justify-center cursor-pointer transition-all duration-300
        ${dragOver ? 'bg-white/30 scale-105' : 'hover:bg-white/25'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-input')?.click()}
      aria-label="Upload CV file by clicking or dragging and dropping. Allowed types: PDF, DOCX,. Maximum size 5MB."
      data-testid="upload-area"
    >
      {/* Paper Icon (emoji), sized to 100x100px via rem units */}
      <div
        className="text-gray-700 w-[15.4375rem] h-[13.125rem] flex flex-col justify-between items-center gap-14 rotate-0 opacity-100"
        aria-hidden="true"
      >
        <span className="text-[6.25rem] leading-none">📜</span>
        
      {/* Upload Text */}
      <div className="flex flex-col gap-[0.1875rem] items-center">
        <p className="text-gray-700 font-medium text-[1.25rem] leading-none text-center capitalize font-['Poppins'] m-0"> 
          Upload Or Drag Your CV
        </p>
        <p className="text-gray-700 font-medium text-[1rem] leading-none text-center font-['Poppins'] m-0">Accept PDF or DOCX until 5MB</p>
      </div>
      </div>
      
      
      {/* Hidden File Input */}
      <input
        id="file-input"
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
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
