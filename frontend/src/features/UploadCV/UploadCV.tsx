import { useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import backgroundImage from '../../assets/aea027abbda7eb6100dda02bdd2e253f3a73b6c8.jpg'
import { UploadCVView } from './UploadCV.view'
import { uploadCV } from '../../services/uploadService'
import { toast } from 'react-toastify'
import type { UploadCVViewProps } from './UploadCV.types'
import { useResumeStore } from '../../store/resumeStore'
import type { UploadProgressData, UploadStatus } from './UploadArea/UploadArea.types'

// Import authentication from store
import { useAuthStore } from '../../store/authStore'

function UploadCV() {
  const navigate = useNavigate()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgressData | undefined>(undefined)
  const startTimeRef = useRef<number | null>(null)
  const { setResumeData } = useResumeStore()
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

  // Use global auth store instead of local state
  const { user, isAuthenticated, logout: authLogout } = useAuthStore()

  const onFileSelect = (file: File) => {
    setSelectedFile(file)
    setProgress(undefined)
    // Reset status to idle when new file is selected
    setStatus('idle')
    setErrorMessage(undefined)
  }

   const onDropFile = (file: File) => {
    setSelectedFile(file)
    setProgress(undefined)
    // Reset status to idle when new file is selected
    setStatus('idle')
    setErrorMessage(undefined)
  }

  /**
   * Upload handler with a specific file
   * Shows progress feedback regardless of authentication status
   */
  const handleUploadWithFile = async (file: File) => {
    if (!file) return
    try {
      setStatus('uploading')
      setErrorMessage(undefined)
      setIsUploading(true)
      startTimeRef.current = Date.now()
      
      const res = await uploadCV(file, {
        onUploadProgress: (evt) => {
          if (!evt.total) return
          const loaded = evt.loaded || 0
          const total = evt.total || file.size
          const pct = Math.min(100, Math.round((loaded / total) * 100))

          const now = Date.now()
          const start = startTimeRef.current ?? now
          const elapsedSec = (now - start) / 1000
          const rate = loaded / Math.max(1, elapsedSec)
          const remaining = total - loaded
          const eta = rate > 0 ? Math.round(remaining / rate) : null

          setProgress({
            fileName: file.name,
            fileSizeBytes: file.size,
            uploadedBytes: loaded,
            totalBytes: total,
            percent: pct,
            etaSeconds: eta,
          })
        },
      })
      
      toast.success(res.message || 'File uploaded successfully')
      setResumeData(res)
      setStatus('success')
      setErrorMessage(undefined)
      
      // ✅ Don't auto-navigate - let user see success and click Next
      // Authentication check will happen when they click Next button
      
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Upload failed'
      console.error('❌ Upload error:', err)
      toast.error(String(msg))
      setStatus('error')
      setErrorMessage('🦖 Oops! We couldn\'t process that / Give it another shot')
    } finally {
      setIsUploading(false)
      if (file) {
        setProgress((prev) =>
          prev
            ? { ...prev, uploadedBytes: file.size, totalBytes: file.size, percent: 100, etaSeconds: 0 }
            : {
                fileName: file.name,
                fileSizeBytes: file.size,
                uploadedBytes: file.size,
                totalBytes: file.size,
                percent: 100,
                etaSeconds: 0,
              }
        )
      }
    }
  }

  /**
   * Primary upload handler
   * Always upload the file and show progress/success feedback
   * Authentication check happens when user clicks Next after success
   */
  const handleUpload = async () => {
    if (!selectedFile) return
    
    // Always proceed with upload to show progress feedback
    await handleUploadWithFile(selectedFile)
  }

  /**
   * Handle Next button click after successful upload
   * This is where authentication check happens
   */
  const handleNext = () => {
    // Check authentication before proceeding to preview
    if (!isAuthenticated) {
      toast.info('Please login to continue')
      navigate('/login', { state: { from: '/upload' } })
      return
    }

    // User is authenticated, proceed to preview
    navigate('/preview')
  }

  const handleRetry = () => {
    setStatus('idle')
    setErrorMessage(undefined)
    setSelectedFile(null)
    setProgress(undefined)
    document.getElementById('file-input')?.click()
  }

  /**
   * Auth handlers
   */
  const handleLogin = useCallback(() => {
    navigate('/login', { state: { from: '/upload' } })
  }, [navigate])

  const handleRegister = useCallback(() => {
    navigate('/registration', { state: { from: '/upload' } })
  }, [navigate])

  const handleLogout = useCallback(async () => {
    try {
      // Use authStore logout which handles both backend call and state update
      await authLogout()
      toast.success('Logged out successfully')
      
      // Reset upload state
      setSelectedFile(null)
      setStatus('idle')
      setErrorMessage(undefined)
      setProgress(undefined)
    } catch (error) {
      console.error('[UploadCV] Logout error:', error)
      toast.error('Failed to logout')
    }
  }, [authLogout])


  const viewProps: UploadCVViewProps = {
    backgroundUrl: backgroundImage,
    ready: Boolean(selectedFile),
    isUploading,
    onUpload: handleUpload,
    onNext: handleNext, // ✅ New prop for Next button after success
    onFileSelect,
    onDropFile,
    progress,
    status,
    errorMessage,
    onStatusChange: (s, msg) => {
      setStatus(s)
      setErrorMessage(msg)
    },
    onRetry: handleRetry,
    // Auth-related props
    user,
    onLogin: handleLogin,
    onRegister: handleRegister,
    onLogout: handleLogout,
  }

  return <UploadCVView {...viewProps} />
}

export default UploadCV