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
  // Debug: pretty-print the server JSON to the browser console
  // Expected shape from backend (UploadResponse):
  // {
  //   success: boolean,
  //   message: string,
  //   data?: {
  //     fileId: string,
  //     extractedData?: {
  //       full_text: string,
  //       parsed: object,
  //       file_info: { filename: string, content_type: string }
  //     }
  //   }
  // }
  // eslint-disable-next-line no-console
  console.log('[uploadService] uploadCV response:', res.data)
  // eslint-disable-next-line no-console
  console.log('[uploadService] uploadCV response (pretty):', JSON.stringify(res.data, null, 2))
  return res.data as UploadResponse
}

export async function getUploadStatus(fileId: string): Promise<UploadResponse> {
  // Backend route: GET /resumes/upload/{file_id}/status
  const base = import.meta.env.VITE_UPLOAD_STATUS_PATH || '/resumes/upload'
  const res = await api.get(`${base}/${encodeURIComponent(fileId)}/status`)
  // Debug: pretty-print status JSON
  // Expected shape:
  // {
  //   success: boolean,
  //   message: string,
  //   data?: { fileId: string, extractedData?: { parse_status: string, has_parsed_json: boolean } }
  // }
  // eslint-disable-next-line no-console
  console.log('[uploadService] getUploadStatus response:', res.data)
  // eslint-disable-next-line no-console
  console.log('[uploadService] getUploadStatus response (pretty):', JSON.stringify(res.data, null, 2))
  return res.data as UploadResponse
}
