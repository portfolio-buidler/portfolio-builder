import axios from 'axios'
import type { UploadResponse } from '../features/UploadCV/UploadCV.types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000',
})

export async function uploadCV(file: File): Promise<UploadResponse> {
  const form = new FormData()
  form.append('file', file)

  // Backend route: POST /resumes/upload (see backend app/features/resumes/routes.py)
  const path = import.meta.env.VITE_UPLOAD_PATH || '/resumes/upload'

  const res = await api.post(path, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data as UploadResponse
}

export async function getUploadStatus(fileId: string): Promise<UploadResponse> {
  // Backend route: GET /resumes/upload/{file_id}/status
  const base = import.meta.env.VITE_UPLOAD_STATUS_PATH || '/resumes/upload'
  const res = await api.get(`${base}/${encodeURIComponent(fileId)}/status`)
  return res.data as UploadResponse
}
