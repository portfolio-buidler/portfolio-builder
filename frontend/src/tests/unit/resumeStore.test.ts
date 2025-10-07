import { beforeEach, describe, expect, it } from 'vitest'
import { useResumeStore } from '../../store/resumeStore'
import type { UploadResponse } from '../../features/UploadCV/UploadCV.types'

// Helper: reset store between tests
const resetStore = () => {
  const { clearResumeData } = useResumeStore.getState()
  clearResumeData()
}

describe('useResumeStore (Zustand)', () => {
  beforeEach(() => {
    resetStore()
  })

  it('should have null resumeData initially', () => {
    expect(useResumeStore.getState().resumeData).toBeNull()
  })

  it('setResumeData should persist the provided payload', () => {
    const payload: UploadResponse = {
      success: true,
      message: 'ok',
      data: {
        fileId: '123',
        extractedData: {
          full_text: 'hello',
          parsed: { name: 'John' },
          file_info: { filename: 'cv.pdf', content_type: 'application/pdf' },
        },
      },
    }

    useResumeStore.getState().setResumeData(payload)
    expect(useResumeStore.getState().resumeData).toEqual(payload)
  })

  it('clearResumeData should reset resumeData to null', () => {
    useResumeStore.getState().setResumeData({ success: true, message: 'ok' })
    expect(useResumeStore.getState().resumeData).not.toBeNull()

    useResumeStore.getState().clearResumeData()
    expect(useResumeStore.getState().resumeData).toBeNull()
  })
})
