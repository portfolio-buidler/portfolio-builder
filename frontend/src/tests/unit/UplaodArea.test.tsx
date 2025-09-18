import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import UploadArea from '../../features/UploadCV/UploadArea'

// Mock react-toastify toast
vi.mock('react-toastify', () => ({
  toast: { error: vi.fn() }
}))
import { toast } from 'react-toastify'

// Mock the fileValidation util used by the component.
// The module path exists in component imports but not in the repo,
// so we mock it as a VIRTUAL module to keep the test isolated and green.
vi.mock('../../utils/fileValidation', () => ({
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg'
  ],
  validateFile: vi.fn()
}))
import { validateFile, ALLOWED_MIME_TYPES } from '../../utils/fileValidation'

// Helpers
const createFile = (name: string, type: string, size = 100) => {
  const blob = new Blob(['a'.repeat(size)], { type })
  return new File([blob], name, { type })
}

const setup = (overrides?: Partial<React.ComponentProps<typeof UploadArea>>) => {
  const onFileSelect = vi.fn()
  const onDropFile = vi.fn()
  render(
    <UploadArea
      onFileSelect={overrides?.onFileSelect ?? onFileSelect}
      onDropFile={overrides?.onDropFile ?? onDropFile}
    />
  )
  const dropZone = screen.getByTestId('upload-area')
  const fileInput = document.getElementById('file-input') as HTMLInputElement
  return { dropZone, fileInput, onFileSelect, onDropFile }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('UploadArea', () => {
  // Verifies accessibility wiring: hidden input exists and is associated via aria-describedby
  it('renders with accessibility attributes', () => {
    const { fileInput } = setup()
    expect(fileInput).toBeInTheDocument()
    expect(fileInput).toHaveAttribute('aria-describedby', 'upload-instructions')
    const instructions = document.getElementById('upload-instructions')
    expect(instructions).toBeInTheDocument()
  })

  // Ensures the file input only accepts types declared by ALLOWED_MIME_TYPES
  it('sets accept attribute from ALLOWED_MIME_TYPES', () => {
    const { fileInput } = setup()
    expect(fileInput.accept).toBe(ALLOWED_MIME_TYPES.join(','))
  })

  // Clicking the visible button should forward the click to the hidden file input
  it('clicking drop zone triggers hidden file input click', () => {
    const { dropZone, fileInput } = setup()
    const clickSpy = vi.spyOn(fileInput, 'click')
    fireEvent.click(dropZone)
    expect(clickSpy).toHaveBeenCalled()
  })

  // Visual feedback: drag over adds a class, leaving removes it
  it('drag over/leave toggles visual state (class changes)', () => {
    const { dropZone } = setup()
    expect(dropZone.className).not.toContain('scale-105')

    fireEvent.dragOver(dropZone)
    expect(dropZone.className).toContain('scale-105')

    fireEvent.dragLeave(dropZone)
    expect(dropZone.className).not.toContain('scale-105')
  })

  // Drop flow: valid file calls onDropFile; invalid shows a toast error
  it('onDrop: valid file calls onDropFile; invalid shows toast.error', () => {
    const { dropZone, onDropFile } = setup()

    const validPdf = createFile('cv.pdf', 'application/pdf')
    ;(validateFile as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({ ok: true })

    fireEvent.drop(dropZone, { dataTransfer: { files: [validPdf] } })
    expect(validateFile).toHaveBeenCalledWith(validPdf)
    expect(onDropFile).toHaveBeenCalledWith(validPdf)

    const invalid = createFile('cv.exe', 'application/x-msdownload')
    ;(validateFile as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({ ok: false, error: 'Invalid file type' })

    fireEvent.drop(dropZone, { dataTransfer: { files: [invalid] } })
    expect(validateFile).toHaveBeenCalledWith(invalid)
    expect(toast.error).toHaveBeenCalledWith('Invalid file type')
  })

  // Input change flow: valid file calls onFileSelect; invalid shows a toast error
  it('onChange: valid file calls onFileSelect; invalid shows toast.error', () => {
    const { fileInput, onFileSelect } = setup()

    const validDocx = createFile(
      'cv.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
    ;(validateFile as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({ ok: true })

    fireEvent.change(fileInput, { target: { files: [validDocx] } })
    expect(validateFile).toHaveBeenCalledWith(validDocx)
    expect(onFileSelect).toHaveBeenCalledWith(validDocx)

    const tooBig = createFile('big.pdf', 'application/pdf', 10_000_000)
    ;(validateFile as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({ ok: false, error: 'File too large' })

    fireEvent.change(fileInput, { target: { files: [tooBig] } })
    expect(validateFile).toHaveBeenCalledWith(tooBig)
    expect(toast.error).toHaveBeenCalledWith('File too large')
  })

  // Guard rails: do nothing when there are no files (no validation, no toasts)
  it('ignores drop when there are no files', () => {
    const { dropZone } = setup()
    fireEvent.drop(dropZone, { dataTransfer: { files: [] } })
    expect(validateFile).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })

  // Guard rails: do nothing when input change has no files
  it('ignores change when there are no files', () => {
    const { fileInput } = setup()
    fireEvent.change(fileInput, { target: { files: null } })
    expect(validateFile).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })
})