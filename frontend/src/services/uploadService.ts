import { api as mainApi } from './api'
import type { UploadResponse } from '../features/UploadCV/UploadCV.types'

// Reuse central api instance (includes baseURL with /api/v1 and token handling)
const api = mainApi

export async function uploadCV(
  file: File,
  opts?: { onUploadProgress?: (evt: ProgressEvent) => void }
): Promise<UploadResponse> {
  const form = new FormData()
  form.append('file', file)


  // Default path (environment can override, but keep relative to baseURL without /api/v1)
  const path = import.meta.env.VITE_UPLOAD_PATH || 'resumes/upload'

  const res = await api.post(path, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: opts?.onUploadProgress,
  })

  return res.data as UploadResponse
}

export async function getUploadStatus(fileId: string): Promise<UploadResponse> {

  const base = import.meta.env.VITE_UPLOAD_STATUS_PATH || 'resumes/upload'
  const res = await api.get(`${base}/${encodeURIComponent(fileId)}/status`)

  return res.data as UploadResponse
}

/**
 * Claim a guest upload after authentication
 * 
 * Converts a temporary guest upload into a permanent authenticated upload.
 * Must be called within 2 minutes of guest upload (before TTL expires).
 * 
 * @param tempId - Temporary upload ID from guest upload response
 * @returns Upload response with permanent resume data
 * @throws Error if temp upload expired, not found, or already claimed
 */
export async function claimGuestUpload(tempId: string): Promise<UploadResponse> {
  const res = await api.post(`resumes/upload/guest/${encodeURIComponent(tempId)}/claim`)
  return res.data as UploadResponse
}

