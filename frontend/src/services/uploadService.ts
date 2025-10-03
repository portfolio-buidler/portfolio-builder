import axios from 'axios'
import type { UploadResponse } from '../features/UploadCV/UploadCV.types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000',
})

export async function uploadCV(
  file: File,
  opts?: { onUploadProgress?: (evt: ProgressEvent) => void }
): Promise<UploadResponse> {
  const form = new FormData()
  form.append('file', file)


  const path = import.meta.env.VITE_UPLOAD_PATH || '/resumes/upload'

  const res = await api.post(path, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: opts?.onUploadProgress,
  })

  console.log('[uploadService] uploadCV response:', res.data)

  console.log('[uploadService] uploadCV response (pretty):', JSON.stringify(res.data, null, 2))
  return res.data as UploadResponse
}

export async function getUploadStatus(fileId: string): Promise<UploadResponse> {

  const base = import.meta.env.VITE_UPLOAD_STATUS_PATH || '/resumes/upload'
  const res = await api.get(`${base}/${encodeURIComponent(fileId)}/status`)

  console.log('[uploadService] getUploadStatus response:', res.data)

  console.log('[uploadService] getUploadStatus response (pretty):', JSON.stringify(res.data, null, 2))
  return res.data as UploadResponse
}
