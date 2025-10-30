import { useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import backgroundImage from '../../assets/aea027abbda7eb6100dda02bdd2e253f3a73b6c8.jpg'
import { UploadCVView } from './UploadCV.view'
import { uploadCV } from '../../services/uploadService'
import { toast } from 'react-toastify'
import type { UploadCVViewProps, User } from './UploadCV.types'
import { useResumeStore } from '../../store/resumeStore'
import type { UploadProgressData, UploadStatus } from './UplaodArea/UploadArea.types'

// Import authentication helpers
import {
  isAuthenticated,
  getCurrentUser,
  logoutUser,
  storeTempCV,
  getTempCV,
  clearTempCV,
  hasPendingUploadAfterAuth,
  setPendingUploadAfterAuth,
} from '../../services/AuthService'

function UploadCV() {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgressData | undefined>(undefined)
  const startTimeRef = useRef<number | null>(null)
  const { resumeData, setResumeData } = useResumeStore()
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

  // Authentication state
  const [user, setUser] = useState<User | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    console.log('[UploadCV] resumeData in global store:', resumeData)
  }, [resumeData])

  /**
   * Check authentication on mount
   */
  useEffect(() => {
    const checkAuth = async () => {
      // Determine if user has a valid session
      if (isAuthenticated()) {
        try {
          const currentUser = await getCurrentUser()
          setUser(currentUser)
        } catch (error) {
          console.error('[UploadCV] Failed to get current user:', error)
          setUser(null)
        }
      }
      setAuthChecked(true)
    }
    checkAuth()
  }, [])

  /**
   * Handle pending upload after authentication
   * If a CV was uploaded before login/registration, resume the upload now
   */
  useEffect(() => {
    if (!authChecked || !user) return
    // Process only if there is a pending upload flag set
    if (hasPendingUploadAfterAuth()) {
      const tempCV = getTempCV()
      if (tempCV) {
        console.log('[UploadCV] Processing pending upload after auth:', tempCV.metadata.fileName)
        // Set the file as selected and clear temp storage
        setSelectedFile(tempCV.file)
        clearTempCV()
        setPendingUploadAfterAuth(false)
        // Trigger upload after a slight delay to allow state updates
        setTimeout(() => {
          handleUploadWithFile(tempCV.file)
        }, 100)
      } else {
        // No temp file found, clear the pending flag
        setPendingUploadAfterAuth(false)
      }
    }
  }, [authChecked, user])

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

  /**
   * Upload handler with a specific file
   * Used to resume uploads after authentication
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
      console.log('Upload response:', res)
      setResumeData(res)
      setStatus('success')
      setErrorMessage(undefined)

      console.log('[UploadCV] Simulated read back from store:', useResumeStore.getState().resumeData)
      // Redirect to preview page after successful upload
      navigate('/preview')
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Upload failed'
      console.error('❌ Upload error:', err)
      toast.error(String(msg))
      setStatus('error')
      setErrorMessage('🦖 Oops! We couldn’t process that / Give it another shot')
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
   * If the user is not authenticated, store the CV and redirect to login
   */
  const handleUpload = async () => {
    if (!selectedFile) return
    // If user is not authenticated, store the file and redirect to login
    if (!isAuthenticated()) {
      console.log('[UploadCV] User not authenticated, storing CV temporarily and redirecting to login')
      // Store the CV temporarily in session
      storeTempCV(selectedFile)
      // Set pending upload flag
      setPendingUploadAfterAuth(true)
      // Inform the user via toast
      toast.info('Please login to continue with your upload')
      // Redirect to login page with state
      navigate('/login', { state: { from: '/upload', hasPendingUpload: true } })
      return
    }
    // User is authenticated, proceed with upload
    await handleUploadWithFile(selectedFile)
  }

  const handleRetry = () => {
    setStatus('idle')
    setErrorMessage(undefined)
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
      await logoutUser()
      setUser(null)
      toast.success('Logged out successfully')
      // Clear any temporary CV data and pending flags
      clearTempCV()
      setPendingUploadAfterAuth(false)
    } catch (error) {
      console.error('[UploadCV] Logout error:', error)
      toast.error('Failed to logout')
    }
  }, [])


  const viewProps: UploadCVViewProps = {
    backgroundUrl: backgroundImage,
    ready: Boolean(selectedFile),
    isUploading,
    onUpload: handleUpload,
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
