import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UploadResponse } from '../features/UploadCV/UploadCV.types'

// Global store to keep the latest resume upload response
export interface ResumeStoreState {
  // Holds the JSON returned by the backend after upload/status calls
  resumeData: UploadResponse | null
  // Save JSON response into the store
  setResumeData: (data: UploadResponse) => void
  // Clear stored data
  clearResumeData: () => void
  
  // Guest upload temporary storage (2-minute TTL)
  tempUploadId: string | null
  tempUploadExpiry: number | null // Unix timestamp in milliseconds
  setTempUpload: (tempId: string, expirySeconds: number) => void
  clearTempUpload: () => void
  isUploadExpired: () => boolean
  claimGuestUpload: (tempId: string) => Promise<void>
}

export const useResumeStore = create<ResumeStoreState>()(
  persist(
    (set, get) => ({
      // Regular resume data
      resumeData: null,
      setResumeData: (data) => set({ resumeData: data }),
      clearResumeData: () => set({ resumeData: null }),
      
      // Guest upload temporary storage
      tempUploadId: null,
      tempUploadExpiry: null,
      
      // Set temporary upload with TTL (typically 120 seconds)
      setTempUpload: (tempId: string, expirySeconds: number) => {
        const expiryTime = Date.now() + (expirySeconds * 1000)
        set({
          tempUploadId: tempId,
          tempUploadExpiry: expiryTime,
        })
      },
      
      // Clear temporary upload data
      clearTempUpload: () => {
        set({
          tempUploadId: null,
          tempUploadExpiry: null,
        })
      },
      
      // Check if temporary upload has expired
      isUploadExpired: () => {
        const { tempUploadExpiry } = get()
        if (!tempUploadExpiry) return false
        return Date.now() > tempUploadExpiry
      },
      
      // Claim guest upload after authentication
      claimGuestUpload: async (tempId: string) => {
        // Import dynamically to avoid circular dependency
        const { claimGuestUpload: claimService } = await import('../services/uploadService')
        const result = await claimService(tempId)
        
        // Clear temp upload and set regular resume data
        set({
          tempUploadId: null,
          tempUploadExpiry: null,
          resumeData: result,
        })
      },
    }),
    {
      name: 'portfolio-resume-storage', // localStorage key
      partialize: (state) => ({
        // Only persist temporary upload fields (not resumeData)
        tempUploadId: state.tempUploadId,
        tempUploadExpiry: state.tempUploadExpiry,
      }),
    }
  )
)
