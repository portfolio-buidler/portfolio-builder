import { describe, it, expect } from 'vitest'
import { validateFile, ALLOWED_MIME_TYPES, MAX_FILE_BYTES } from '../../utils/fileValidation'

// Helper to create a File of a given size and type
const createFile = (name: string, type: string, size = 100) => {
  const blob = new Blob(['a'.repeat(size)], { type })
  return new File([blob], name, { type })
}

describe('fileValidation utility', () => {
  it('allows PDF files', () => {
    const file = createFile('cv.pdf', 'application/pdf')
    const res = validateFile(file)
    expect(res).toEqual({ ok: true })
  })

  it('allows DOCX files', () => {
    const file = createFile(
      'cv.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
    const res = validateFile(file)
    expect(res).toEqual({ ok: true })
  })

  it('rejects disallowed types with the expected message', () => {
    const file = createFile('cv.png', 'image/png')
    const res = validateFile(file)
    expect(res).toEqual({
      ok: false,
      // Matches the current implementation (note the trailing comma after DOCX)
      error: 'Invalid file type. Allowed types: PDF, DOCX,',
    })
  })

  it('accepts files exactly at the size limit', () => {
    const file = createFile('cv.pdf', 'application/pdf', MAX_FILE_BYTES)
    const res = validateFile(file)
    expect(res).toEqual({ ok: true })
  })

  it('rejects files larger than the size limit with the expected message', () => {
    const file = createFile('cv.pdf', 'application/pdf', MAX_FILE_BYTES + 1)
    const res = validateFile(file)
    expect(res).toEqual({
      ok: false,
      error: 'File is too large. Maximum allowed size is 5MB.',
    })
  })

  it('keeps ALLOWED_MIME_TYPES consistent with what input accept should reflect', () => {
    // Ensure the util exposes the list we expect the component to use
    expect(ALLOWED_MIME_TYPES).toEqual([
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ])
  })
})
