import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
})

export async function uploadCV(file: File) {
  const form = new FormData()
  form.append('file', file)

  // Adjust path to match your backend route, e.g. "/api/upload"
  const path = import.meta.env.VITE_UPLOAD_PATH || '/api/upload'

  const res = await api.post(path, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}
