
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import UploadCV from '../../features/UploadCV/UploadCV'
import { useResumeStore } from '../../store/resumeStore'

// Mock toast
vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))
import { toast } from 'react-toastify'

// Mock upload service
vi.mock('../../services/uploadService', () => ({
  uploadCV: vi.fn(),
}))
import { uploadCV } from '../../services/uploadService'

type Mocked<T> = T & { mockResolvedValue: (...args: any[]) => any; mockRejectedValue: (...args: any[]) => any }

const createFile = (name: string, type: string, size = 100) => {
  const blob = new Blob(['x'.repeat(size)], { type })
  return new File([blob], name, { type })
}

const resetStore = () => {
  const { clearResumeData } = useResumeStore.getState()
  clearResumeData()
}

beforeEach(() => {
  vi.clearAllMocks()
  resetStore()
})

describe('UploadCV integration', () => {
  it('selects a file, enables CTA, uploads, updates store, and shows success toast', async () => {
    const mockResponse = {
      success: true,
      message: 'Uploaded OK',
      data: {
        fileId: 'abc123',
        extractedData: {
          full_text: 'hello',
          parsed: { name: 'Jane' },
          file_info: { filename: 'cv.pdf', content_type: 'application/pdf' },
        },
      },
    }

    ;(uploadCV as unknown as Mocked<typeof uploadCV>).mockResolvedValue(mockResponse)

    render(<UploadCV />)

    // Initially CTA should be disabled (no file selected)
    const cta = screen.getByRole('button', { name: /let's do it!/i }) as HTMLButtonElement
    expect(cta).toBeDisabled()

    // Select a valid file through the hidden input
    const input = document.getElementById('file-input') as HTMLInputElement
    const file = createFile('cv.pdf', 'application/pdf')
    fireEvent.change(input, { target: { files: [file] } })

    // Now CTA should be enabled
    expect(cta).not.toBeDisabled()

    // Click CTA to trigger upload
    fireEvent.click(cta)

    // After upload, verify service was called, store updated, and success toast shown
    await waitFor(() => {
      expect(uploadCV).toHaveBeenCalledTimes(1)
      expect(useResumeStore.getState().resumeData).toEqual(mockResponse)
      expect(toast.success).toHaveBeenCalledWith('Uploaded OK')
    })
  })

  it('shows error toast when upload fails', async () => {
    const error = {
      response: { data: { detail: 'Upload failed due to server error' } },
    }
    ;(uploadCV as unknown as Mocked<typeof uploadCV>).mockRejectedValue(error)

    render(<UploadCV />)

    const input = document.getElementById('file-input') as HTMLInputElement
    const file = createFile('cv.pdf', 'application/pdf')
    fireEvent.change(input, { target: { files: [file] } })

    const cta = screen.getByRole('button', { name: /let's do it!/i }) as HTMLButtonElement
    fireEvent.click(cta)

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Upload failed due to server error'))

    // Store should remain null on failure
    expect(useResumeStore.getState().resumeData).toBeNull()
  })
})
