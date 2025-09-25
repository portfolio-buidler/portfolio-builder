import { create } from 'zustand'
import type { UploadResponse } from '../features/UploadCV/UploadCV.types'

// Global store to keep the latest resume upload response
export interface ResumeStoreState {
  // Holds the JSON returned by the backend after upload/status calls
  resumeData: UploadResponse | null
  // Save JSON response into the store
  setResumeData: (data: UploadResponse) => void
  // Clear stored data
  clearResumeData: () => void
}

export const useResumeStore = create<ResumeStoreState>((set) => ({
  resumeData: null,
  setResumeData: (data) => set({ resumeData: data }),
  clearResumeData: () => set({ resumeData: null }),
}))
