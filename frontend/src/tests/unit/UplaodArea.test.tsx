import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import UploadArea from '../../features/UploadCV/UploadArea/UploadArea'

// Mock react-toastify toast (אנחנו משאירים את זה כי אולי נצטרך בעתיד, אבל כרגע הבדיקה שונתה)
vi.mock('react-toastify', () => ({
  toast: { error: vi.fn() }
}))
import { toast } from 'react-toastify'

// Mock the fileValidation util
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

// Update setup to include onStatusChange
const setup = (overrides?: Partial<React.ComponentProps<typeof UploadArea>>) => {
  const onFileSelect = vi.fn()
  const onDropFile = vi.fn()
  const onStatusChange = vi.fn() 

  render(
    <UploadArea
      onFileSelect={overrides?.onFileSelect ?? onFileSelect}
      onDropFile={overrides?.onDropFile ?? onDropFile}
      onStatusChange={overrides?.onStatusChange ?? onStatusChange} 
      status={overrides?.status ?? 'idle'}
    />
  )
  const dropZone = screen.getByTestId('upload-area')
  const fileInput = document.getElementById('file-input') as HTMLInputElement
  
  return { dropZone, fileInput, onFileSelect, onDropFile, onStatusChange }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('UploadArea', () => {
  it('renders with accessibility attributes', () => {
    const { fileInput } = setup()
    expect(fileInput).toBeInTheDocument()
    expect(fileInput).toHaveAttribute('aria-describedby', 'upload-instructions')
    const instructions = document.getElementById('upload-instructions')
    expect(instructions).toBeInTheDocument()
  })

  it('sets accept attribute from ALLOWED_MIME_TYPES', () => {
    const { fileInput } = setup()
    expect(fileInput.accept).toBe(ALLOWED_MIME_TYPES.join(','))
  })

  it('clicking drop zone triggers hidden file input click', () => {
    const { dropZone, fileInput } = setup()
    const clickSpy = vi.spyOn(fileInput, 'click')
    fireEvent.click(dropZone)
    expect(clickSpy).toHaveBeenCalled()
  })

  it('drag over/leave toggles visual state via data-dragover attribute', () => {
    const { dropZone } = setup()
    expect(dropZone).toHaveAttribute('data-dragover', 'false')

    fireEvent.dragOver(dropZone)
    expect(dropZone).toHaveAttribute('data-dragover', 'true')

    fireEvent.dragLeave(dropZone)
    expect(dropZone).toHaveAttribute('data-dragover', 'false')
  })

  it('onDrop: valid file calls onDropFile; invalid calls onStatusChange with error', () => {
    const { dropZone, onDropFile, onStatusChange } = setup()

    const validPdf = createFile('cv.pdf', 'application/pdf')
    ;(validateFile as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({ ok: true })

    fireEvent.drop(dropZone, { dataTransfer: { files: [validPdf] } })
    expect(validateFile).toHaveBeenCalledWith(validPdf)
    expect(onDropFile).toHaveBeenCalledWith(validPdf)

    const invalid = createFile('cv.exe', 'application/x-msdownload')
    ;(validateFile as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({ ok: false, error: 'Invalid file type' })

    fireEvent.drop(dropZone, { dataTransfer: { files: [invalid] } })
    expect(validateFile).toHaveBeenCalledWith(invalid)
    
    expect(onStatusChange).toHaveBeenCalledWith('error', 'Invalid file type')
  })

  it('onChange: valid file calls onFileSelect; invalid calls onStatusChange with error', () => {
    const { fileInput, onFileSelect, onStatusChange } = setup()

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
    
    expect(onStatusChange).toHaveBeenCalledWith('error', 'File too large')
  })

  it('ignores drop when there are no files', () => {
    const { dropZone } = setup()
    fireEvent.drop(dropZone, { dataTransfer: { files: [] } })
    expect(validateFile).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('ignores change when there are no files', () => {
    const { fileInput } = setup()
    fireEvent.change(fileInput, { target: { files: null } })
    expect(validateFile).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('onDrop: validates and uses only the first file when multiple files provided', () => {
    const { dropZone, onDropFile } = setup()
    const first = createFile('first.pdf', 'application/pdf')
    const second = createFile('second.pdf', 'application/pdf')

    ;(validateFile as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({ ok: true })

    fireEvent.drop(dropZone, { dataTransfer: { files: [first, second] } })
    expect(validateFile).toHaveBeenCalledTimes(1)
    expect(validateFile).toHaveBeenCalledWith(first)
    expect(onDropFile).toHaveBeenCalledTimes(1)
    expect(onDropFile).toHaveBeenCalledWith(first)
  })

  it('onChange: validates and uses only the first file when multiple files provided', () => {
    const { fileInput, onFileSelect } = setup()
    const first = createFile('first.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    const second = createFile('second.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')

    ;(validateFile as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({ ok: true })

    fireEvent.change(fileInput, { target: { files: [first, second] } })
    expect(validateFile).toHaveBeenCalledTimes(1)
    expect(validateFile).toHaveBeenCalledWith(first)
    expect(onFileSelect).toHaveBeenCalledTimes(1)
    expect(onFileSelect).toHaveBeenCalledWith(first)
  })

  it('has the expected aria-label on the drop zone', () => {
    const { dropZone } = setup()
    expect(dropZone).toHaveAttribute(
      'aria-label',
      'Upload CV file by clicking or dragging and dropping. Allowed types: PDF, DOCX,. Maximum size 5MB.'
    )
  })
})