import { useCallback, useMemo, useRef, useState } from 'react'
import type { UploadAreaProps, UploadProgressData } from './UploadArea.types'
import { validateFile, ALLOWED_MIME_TYPES } from '../../../utils/fileValidation'
import { UploadAreaView } from './UploadArea.view'


function UploadArea({ onFileSelect, onDropFile, isUploading, onCancelUpload, progress: externalProgress, status, errorMessage, onStatusChange }: UploadAreaProps) {
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  // Note: The following state variables are kept for potential future use with internal upload progress tracking
  // Currently, upload progress is managed externally via the parent component
  const uploadedBytes = 0
  const totalBytes = 0
  const percent = 0
  const etaSeconds: number | null = null

  const abortControllerRef = useRef<AbortController | null>(null)

  const accept = useMemo(() => ALLOWED_MIME_TYPES.join(','), [])

  const internalProgress: UploadProgressData | undefined = useMemo(() => {
    if (!file) return undefined
    return {
      fileName: file.name,
      fileSizeBytes: file.size,
      uploadedBytes,
      totalBytes,
      percent,
      etaSeconds,
    }
  }, [file, uploadedBytes, totalBytes, percent, etaSeconds])

  // Note: beginUpload function removed - upload is now handled by parent component via uploadService
  // to avoid duplicate requests. See commented useEffect below for reference.

  const validateAndSetFile = useCallback(
    (f: File | null, triggerCallbacks: { select?: boolean; drop?: boolean } = {}) => {
      if (!f) return
      const validation = validateFile(f)
      if (validation.ok) {
        setFile(f)
        if (typeof onStatusChange === 'function') {
          onStatusChange('idle', undefined)
        }
        if (triggerCallbacks.select) onFileSelect(f)
        if (triggerCallbacks.drop) onDropFile(f)
      } else {
        if (typeof onStatusChange === 'function') {
          onStatusChange('error', validation.error)
        }
        return
      }
    },
    [onDropFile, onFileSelect, onStatusChange]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const files = e.dataTransfer.files
      if (files.length > 0) {
        validateAndSetFile(files[0], { drop: true })
      }
    },
    [validateAndSetFile]
  )

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        validateAndSetFile(files[0], { select: true })
      }
    },
    [validateAndSetFile]
  )

  const handleClick = useCallback(() => {
    document.getElementById('file-input')?.click()
  }, [])

  /*
  useEffect(() => {
    if (!isUploading || !file) return
    beginUpload(file)

    return () => {
      // Cleanup if component unmounts mid-upload
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [isUploading, file, beginUpload])
  */
  /*
  // Disabled: Parent component now owns the upload via uploadService.
  // Keeping this code commented for reference during testing to avoid duplicate requests to /api/upload.
  useEffect(() => {
    if (!isUploading || !file) return
    beginUpload(file)

    return () => {
      // Cleanup if component unmounts mid-upload
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [isUploading, file, beginUpload])
  */

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    onCancelUpload?.()
  }, [onCancelUpload])

  return (
    <UploadAreaView
      accept={accept}
      dragOver={dragOver}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onFileInputChange={handleFileInputChange}
      isUploading={isUploading}
      progress={externalProgress ?? internalProgress}
      onCancelUpload={handleCancel}
      status={status}
      errorMessage={errorMessage}
    />
  )
}

export default UploadArea

