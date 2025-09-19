import { useState } from 'react'
import backgroundImage from '../../assets/aea027abbda7eb6100dda02bdd2e253f3a73b6c8.jpg'
import UploadArea from './UploadArea'
import { uploadCV } from '../../services/uploadService'
import { toast } from 'react-toastify'

function UploadCV() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const onFileSelect = (file: File) => {
    console.log('📁 File selected via file input:')
    console.log('Name:', file.name)
    console.log('Size:', file.size, 'bytes', `(${(file.size / 1024 / 1024).toFixed(2)} MB)`)
    console.log('Type:', file.type)
    console.log('Last Modified:', new Date(file.lastModified).toLocaleString())
    console.log('Full File Object:', file)
    console.log('---')
    
    setSelectedFile(file)
  }

 

  const onDropFile = (file: File) => {
    console.log('🎯 File dropped via drag & drop:')
    console.log('Name:', file.name)
    console.log('Size:', file.size, 'bytes', `(${(file.size / 1024 / 1024).toFixed(2)} MB)`)
    console.log('Type:', file.type)
    console.log('Last Modified:', new Date(file.lastModified).toLocaleString())
    console.log('Full File Object:', file)
    console.log('---')
    
    setSelectedFile(file)
  }

  // REAL upload handler calling backend on port 8000
  const handleUpload = async () => {
    if (!selectedFile) return
    try {
      setIsUploading(true)
      const res = await uploadCV(selectedFile)
      toast.success(res.message || 'File uploaded successfully')
      // Optionally, you can use res.data?.fileId for next steps
      console.log('Upload response:', res)
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Upload failed'
      console.error('❌ Upload error:', err)
      toast.error(String(msg))
    } finally {
      setIsUploading(false)
    }
  }


  return (
    <div 
      className="min-h-screen flex flex-col items-center p-8 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <h1 
        className="text-center capitalize whitespace-nowrap font-poppins font-title-normal text-title-xl leading-none tracking-title-xl text-title mt-title-top ml-title-left"
        style={{
          width: '61%'
        }}
      >
        Portfolio <span className="font-title-bold">Builder</span>
      </h1>
      
      <div className="flex flex-row items-center justify-between gap-[8rem]" style={{ 
        maxWidth: "57.5rem",
        marginTop: "8rem",
        marginLeft: "19.4rem"
      }}>
        <UploadArea onFileSelect={onFileSelect} onDropFile={onDropFile} />

        {/* Let's Do It Button */}
        <button 
          className={`
            w-[10.5rem] h-[3.375rem] rounded-[1.25rem] pt-[1.375rem] pr-[1.125rem] pb-[1.375rem] pl-[1.125rem]
            transition-colors duration-200 flex items-center justify-between text-[1.25rem] rotate-0 opacity-100
            outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0
            disabled:outline-none disabled:ring-0 disabled:focus:outline-none disabled:focus:ring-0
            ${selectedFile 
              ? "[background:var(--Colors-Green,_#34C759)] hover:[background:var(--Colors-Green,_#34C759)] text-white cursor-pointer" 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
        >
          <div className="flex items-center justify-center gap-[0.1875rem] whitespace-nowrap">
            <span className="font-['Poppins'] font-medium text-[1.25rem] leading-[2rem] text-center capitalize align-middle">Let's Do It!</span>
            <span className="text-[2rem] leading-[2rem] w-[1.875rem] h-[2rem] text-center">→</span>
          </div>
        </button>
      </div>
    </div>
  )
}

export default UploadCV
