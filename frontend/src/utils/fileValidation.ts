// Reusable file validation helper for uploads

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export const MAX_FILE_BYTES = 2 * 1024 * 1024 // 2MB

export type ValidationResult = { ok: true } | { ok: false; error: string }

export function validateFile(file: File): ValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      ok: false,
      error: 'Invalid file type. Please upload a PDF or DOCX file.',
    }
  }

  if (file.size > MAX_FILE_BYTES) {
    const sizeMB = (MAX_FILE_BYTES / 1024 / 1024).toFixed(0)
    return {
      ok: false,
      error: `File is too large. Maximum allowed size is ${sizeMB}MB.`,
    }
  }

  return { ok: true }
}
