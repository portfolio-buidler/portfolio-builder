import { useRef, useState } from 'react'
import backgroundImage from '../../assets/aea027abbda7eb6100dda02bdd2e253f3a73b6c8.jpg'
import { UploadCVView } from './UploadCV.view'
import { uploadCV } from '../../services/uploadService'
import { toast } from 'react-toastify'
import type { UploadCVViewProps } from './UploadCV.types'
import { useResumeStore } from '../../store/resumeStore'
import { useEffect } from 'react'
import type { UploadProgressData } from './UplaodArea/UploadArea.types'

function UploadCV() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgressData | undefined>(undefined)
  const startTimeRef = useRef<number | null>(null)
  const { resumeData, setResumeData } = useResumeStore()

  useEffect(() => {
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
    setProgress(undefined)
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

  const handleUpload = async () => {
    if (!selectedFile) return
    try {
      setIsUploading(true)
      startTimeRef.current = Date.now()
      const res = await uploadCV(selectedFile, {
        onUploadProgress: (evt) => {
          if (!evt.total) return
          const loaded = evt.loaded || 0
          const total = evt.total || selectedFile.size
          const pct = Math.min(100, Math.round((loaded / total) * 100))

          const now = Date.now()
          const start = startTimeRef.current ?? now
          const elapsedSec = (now - start) / 1000
          const rate = loaded / Math.max(1, elapsedSec)
          const remaining = total - loaded
          const eta = rate > 0 ? Math.round(remaining / rate) : null

          setProgress({
            fileName: selectedFile.name,
            fileSizeBytes: selectedFile.size,
            uploadedBytes: loaded,
            totalBytes: total,
            percent: pct,
            etaSeconds: eta,
          })
        },
      })
      toast.success(res.message || 'File uploaded successfully')
      console.log('Upload response:', res)
      setResumeData(res)

      console.log('[UploadCV] Simulated read back from store:', useResumeStore.getState().resumeData)
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Upload failed'
      console.error('❌ Upload error:', err)
      toast.error(String(msg))
    } finally {
      setIsUploading(false)
      if (selectedFile) {
        setProgress((prev) =>
          prev
            ? { ...prev, uploadedBytes: selectedFile.size, totalBytes: selectedFile.size, percent: 100, etaSeconds: 0 }
            : {
                fileName: selectedFile.name,
                fileSizeBytes: selectedFile.size,
                uploadedBytes: selectedFile.size,
                totalBytes: selectedFile.size,
                percent: 100,
                etaSeconds: 0,
              }
        )
      }
    }
  }


  const viewProps: UploadCVViewProps = {
    backgroundUrl: backgroundImage,
    ready: Boolean(selectedFile),
    isUploading,
    onUpload: handleUpload,
    onFileSelect,
    onDropFile,
    progress,
  }

  return <UploadCVView {...viewProps} />
}

export default UploadCV
