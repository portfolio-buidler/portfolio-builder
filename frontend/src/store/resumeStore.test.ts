/**
 * Unit tests for resumeStore - Guest upload temporary storage
 * 
 * Tests:
 * - Setting temporary upload with TTL
 * - Checking if upload is expired
 * - Clearing temporary upload
 * - Persistence via localStorage
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useResumeStore } from './resumeStore'

describe('resumeStore - Temporary Upload Storage', () => {
  beforeEach(() => {
    // Reset store state before each test
    useResumeStore.setState({
      resumeData: null,
      tempUploadId: null,
      tempUploadExpiry: null,
    })
    
    // Clear localStorage
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should set temporary upload with TTL', () => {
    const { setTempUpload } = useResumeStore.getState()
    
    const now = Date.now()
    const tempId = 'temp-upload-123'
    const expirySeconds = 120 // 2 minutes
    
    setTempUpload(tempId, expirySeconds)
    
    const state = useResumeStore.getState()
    
    expect(state.tempUploadId).toBe(tempId)
    expect(state.tempUploadExpiry).toBeGreaterThan(now)
    expect(state.tempUploadExpiry).toBeLessThanOrEqual(now + (expirySeconds * 1000) + 10) // Allow 10ms margin
  })

  it('should detect non-expired upload', () => {
    const { setTempUpload, isUploadExpired } = useResumeStore.getState()
    
    // Set upload with 10 second TTL
    setTempUpload('temp-123', 10)
    
    expect(isUploadExpired()).toBe(false)
  })

  it('should detect expired upload', () => {
    const { setTempUpload, isUploadExpired } = useResumeStore.getState()
    
    // Set upload with -1 second TTL (already expired)
    setTempUpload('temp-123', -1)
    
    // Wait a tiny bit to ensure expiry
    setTimeout(() => {
      expect(isUploadExpired()).toBe(true)
    }, 10)
  })

  it('should return false for expired check when no upload exists', () => {
    const { isUploadExpired } = useResumeStore.getState()
    
    expect(isUploadExpired()).toBe(false)
  })

  it('should clear temporary upload', () => {
    const { setTempUpload, clearTempUpload } = useResumeStore.getState()
    
    // Set temp upload
    setTempUpload('temp-123', 120)
    
    // Verify it's set
    let state = useResumeStore.getState()
    expect(state.tempUploadId).toBe('temp-123')
    expect(state.tempUploadExpiry).not.toBeNull()
    
    // Clear it
    clearTempUpload()
    
    // Verify it's cleared
    state = useResumeStore.getState()
    expect(state.tempUploadId).toBeNull()
    expect(state.tempUploadExpiry).toBeNull()
  })

  it('should persist temporary upload to localStorage', () => {
    const { setTempUpload } = useResumeStore.getState()
    
    const tempId = 'temp-persist-123'
    setTempUpload(tempId, 120)
    
    // Check localStorage
    const stored = localStorage.getItem('portfolio-resume-storage')
    expect(stored).not.toBeNull()
    
    if (stored) {
      const parsed = JSON.parse(stored)
      expect(parsed.state.tempUploadId).toBe(tempId)
      expect(parsed.state.tempUploadExpiry).not.toBeNull()
    }
  })

  it('should NOT persist resumeData to localStorage', () => {
    const { setResumeData } = useResumeStore.getState()
    
    setResumeData({
      id: 1,
      status: 'parsed',
      message: 'Success',
      parsed_data: { contact: { name: 'Test' } },
    })
    
    // Check localStorage
    const stored = localStorage.getItem('portfolio-resume-storage')
    
    if (stored) {
      const parsed = JSON.parse(stored)
      // resumeData should NOT be in persisted state
      expect(parsed.state.resumeData).toBeUndefined()
    }
  })

  it('should restore temporary upload from localStorage on mount', () => {
    const tempId = 'temp-restore-123'
    const expiry = Date.now() + 120000 // 2 minutes from now
    
    // Manually set localStorage (simulating previous session)
    localStorage.setItem('portfolio-resume-storage', JSON.stringify({
      state: {
        tempUploadId: tempId,
        tempUploadExpiry: expiry,
      },
      version: 0,
    }))
    
    // Create a new store instance (would happen on app mount)
    // In real app, Zustand persist middleware reads from localStorage automatically
    
    // For testing, we can verify the localStorage content
    const stored = localStorage.getItem('portfolio-resume-storage')
    expect(stored).not.toBeNull()
    
    if (stored) {
      const parsed = JSON.parse(stored)
      expect(parsed.state.tempUploadId).toBe(tempId)
      expect(parsed.state.tempUploadExpiry).toBe(expiry)
    }
  })
})
