import { useState } from 'react'
import backgroundImage from '../../assets/aea027abbda7eb6100dda02bdd2e253f3a73b6c8.jpg'
import UploadArea from './UploadArea'

function UploadCV() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

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
            w-[10.5rem] h-[3.375rem] rounded-[20px] pt-[22px] pr-[18px] pb-[22px] pl-[18px]
            transition-colors duration-200 flex items-center justify-between text-[1.25rem]
            ${selectedFile 
              ? 'bg-green-500 hover:bg-green-600 text-white cursor-pointer' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
          disabled={!selectedFile}
        >
          <span className="pl-[18px]">Let's Do It!</span>
          <span>→</span>
        </button>
      </div>
    </div>
  )
}

export default UploadCV
