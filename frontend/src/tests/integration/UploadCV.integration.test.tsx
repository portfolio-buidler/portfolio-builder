import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom' 
import UploadCV from '../../features/UploadCV/UploadCV'
import { useResumeStore } from '../../store/resumeStore'
import { useAuthStore } from '../../store/authStore'

// Mock toast
vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))
import { toast } from 'react-toastify'

// Mock upload service
vi.mock('../../services/uploadService', () => ({
  uploadCV: vi.fn(),
  uploadGuestCV: vi.fn(), // ensure both functions are available for auth & guest paths
}))
import { uploadCV, uploadGuestCV } from '../../services/uploadService'

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
    // Set auth state to emulate authenticated user
    useAuthStore.getState().setUser({
      id: 1,
      email: 'test@example.com',
      full_name: 'Test User',
      headline: null,
      location: null,
      timezone: null,
      languages: null,
      phone: null,
      created_at: new Date().toISOString(),
      updated_at: null,
    })
    ;(uploadGuestCV as unknown as Mocked<typeof uploadGuestCV>).mockResolvedValue(mockResponse)

    render(
      <MemoryRouter>
        <UploadCV />
      </MemoryRouter>
    )

    // Initially CTA should be disabled (no file selected)
    const cta = screen.getByRole('button', { name: /next/i }) as HTMLButtonElement
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
    ;(uploadGuestCV as unknown as Mocked<typeof uploadGuestCV>).mockRejectedValue(error)

    // Ensure guest user state (unauthenticated)
    useAuthStore.getState().setUser(null)

    render(
      <MemoryRouter>
        <UploadCV />
      </MemoryRouter>
    )

    const input = document.getElementById('file-input') as HTMLInputElement
    const file = createFile('cv.pdf', 'application/pdf')
    fireEvent.change(input, { target: { files: [file] } })

    const cta = screen.getByRole('button', { name: /next/i }) as HTMLButtonElement
    fireEvent.click(cta)

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Upload failed due to server error'))

    // Store should remain null on failure
    expect(useResumeStore.getState().resumeData).toBeNull()
  })
})