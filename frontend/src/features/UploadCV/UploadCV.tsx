import { useState } from 'react'
import backgroundImage from '../../assets/aea027abbda7eb6100dda02bdd2e253f3a73b6c8.jpg'
import { UploadCVView } from './UploadCV.view'
import { uploadCV } from '../../services/uploadService'
import { toast } from 'react-toastify'
import type { UploadCVViewProps } from './UploadCV.types'
import { useResumeStore } from '../../store/resumeStore'
import { useEffect } from 'react'

function UploadCV() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  // Zustand: read state and actions
  const { resumeData, setResumeData } = useResumeStore()

  // Log whenever the global resumeData changes to verify global accessibility
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[UploadCV] resumeData in global store:', resumeData)
  }, [resumeData])

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

  // Upload handler calling backend API
  const handleUpload = async () => {
    if (!selectedFile) return
    try {
      setIsUploading(true)
      const res = await uploadCV(selectedFile)
      toast.success(res.message || 'File uploaded successfully')
      // Optionally, you can use res.data?.fileId for next steps
      console.log('Upload response:', res)
      // Save server JSON into global store so it is accessible across the app
      setResumeData(res)

      // Simulate further processing using the stored data (example only)
      // eslint-disable-next-line no-console
      console.log('[UploadCV] Simulated read back from store:', useResumeStore.getState().resumeData)
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Upload failed'
      console.error('❌ Upload error:', err)
      toast.error(String(msg))
    } finally {
      setIsUploading(false)
    }
  }


  const viewProps: UploadCVViewProps = {
    backgroundUrl: backgroundImage,
    ready: Boolean(selectedFile),
    isUploading,
    onUpload: handleUpload,
    onFileSelect,
    onDropFile,
  }

  return <UploadCVView {...viewProps} />
}

export default UploadCV
