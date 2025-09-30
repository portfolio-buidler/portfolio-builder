import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { UploadAreaProps, UploadProgressData } from './UploadArea.types'
import { validateFile, ALLOWED_MIME_TYPES } from '../../../utils/fileValidation'
import { toast } from 'react-toastify'
import { UploadAreaView } from './UploadArea.view'
import axios from 'axios'
import type { AxiosProgressEvent } from 'axios'

function UploadArea({ onFileSelect, onDropFile, isUploading, onCancelUpload }: UploadAreaProps) {
  // Design preview: force show progress component without uploading
  // TEMP: Set to true for pixel-perfect comparison. Do NOT remove this constant.
  // To disable later, change `true` to `false` or rely on the env flag below.
  const DESIGN_PREVIEW =
    true || ((import.meta as any)?.env?.VITE_SHOW_UPLOAD_PROGRESS === 'true')
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadedBytes, setUploadedBytes] = useState(0)
  const [totalBytes, setTotalBytes] = useState(0)
  const [percent, setPercent] = useState(0)
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null)

  const startTimeRef = useRef<number | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const accept = useMemo(() => ALLOWED_MIME_TYPES.join(','), [])

  const progress: UploadProgressData | undefined = useMemo(() => {
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

  // Mock progress for pixel-perfect design review
  const previewProgress: UploadProgressData | undefined = useMemo(() => {
    if (!DESIGN_PREVIEW) return undefined
    const total = 2 * 1024 * 1024 // 2 MB
    const uploaded = Math.round(total * 0.68) // 68%
    return {
      fileName: 'My CV – Product Designer.pdf',
      fileSizeBytes: total,
      uploadedBytes: uploaded,
      totalBytes: total,
      percent: Math.round((uploaded / total) * 100),
      etaSeconds: 12,
    }
  }, [DESIGN_PREVIEW])

  const beginUpload = useCallback(
    (selected: File) => {
      // Prevent duplicate uploads
      if (abortControllerRef.current) return

      const controller = new AbortController()
      abortControllerRef.current = controller

      startTimeRef.current = Date.now()
      setUploadedBytes(0)
      setTotalBytes(selected.size)
      setPercent(0)
      setEtaSeconds(null)

      const form = new FormData()
      form.append('file', selected)

      axios
        .post('/api/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          signal: controller.signal,
          onUploadProgress: (evt: AxiosProgressEvent) => {
            if (!evt.total) return
            const loaded = evt.loaded
            const total = evt.total

            setUploadedBytes(loaded)
            setTotalBytes(total)

            const pct = Math.min(100, Math.round((loaded / total) * 100))
            setPercent(pct)

            const now = Date.now()
            const start = startTimeRef.current ?? now
            const elapsedSec = (now - start) / 1000
            const rate = loaded / Math.max(1, elapsedSec) // bytes/sec
            const remaining = total - loaded
            const eta = rate > 0 ? Math.round(remaining / rate) : null
            setEtaSeconds(eta)
          },
        })
        .then(() => {
          setPercent(100)
          setUploadedBytes(selected.size)
          setEtaSeconds(0)
        })
        .catch((err: any) => {
          // Ignore user-initiated cancel/abort
          if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError') {
            return
          }
          toast.error('Upload failed. Please try again.')
        })
        .finally(() => {
          abortControllerRef.current = null
        })
    },
    []
  )

  const validateAndSetFile = useCallback(
    (f: File | null, triggerCallbacks: { select?: boolean; drop?: boolean } = {}) => {
      if (!f) return
      const validation = validateFile(f)
      if (validation.ok) {
        setFile(f)
        if (triggerCallbacks.select) onFileSelect(f)
        if (triggerCallbacks.drop) onDropFile(f)
      } else {
        toast.error(validation.error)
      }
    },
    [onDropFile, onFileSelect]
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
      // In design preview, render the uploading stack (emoji + progress)
      isUploading={DESIGN_PREVIEW ? true : isUploading}
      progress={DESIGN_PREVIEW ? previewProgress : progress}
      onCancelUpload={handleCancel}
    />
  )
}

export default UploadArea

