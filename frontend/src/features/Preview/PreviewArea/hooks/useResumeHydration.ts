// src/features/Preview/PreviewArea/hooks/useResumeHydration.ts

/**
 * Resume Hydration Hook
 * 
 * Main orchestration hook that:
 * 1. Reads parsed CV data from Zustand store
 * 2. Transforms backend format → frontend section formats
 * 3. Returns hydrated initial data for PreviewArea
 * 
 * Usage:
 * const { hydratedData, hasHydrated, markAsHydrated } = useResumeHydration()
 * 
 * if (hydratedData && !hasHydrated) {
 *   // Use hydratedData to initialize sections
 *   markAsHydrated()
 * }
 */

import { useMemo, useState } from 'react'
import { useResumeStore } from '../../../../store/resumeStore'
import { categorizeSkills } from '../utils/skillsCategorizer.ts'
import {
  transformAbout,
  transformEducation,
  transformExperience,
  transformProjects,
  transformCommunication,
  type BackendParsedData,
} from '../utils/dataTransformers.ts'
import type { SkillsData, CommunicationData } from '../PreviewArea.types'

/**
 * Hydrated data structure ready for PreviewArea consumption
 */
export interface HydratedResumeData {
  about: string
  education: string
  experience: string
  projects: string
  skills: SkillsData
  communication: CommunicationData
}

/**
 * Hook return type
 */
export interface UseResumeHydrationReturn {
  hydratedData: HydratedResumeData | null
  hasHydrated: boolean
  markAsHydrated: () => void
}

/**
 * Main hydration hook
 */
export function useResumeHydration(): UseResumeHydrationReturn {
  const { resumeData } = useResumeStore()
  const [hasHydrated, setHasHydrated] = useState(false)

  /**
   * Transform backend data → frontend format (memoized)
   * Only recomputes when resumeData changes
   */
  const hydratedData = useMemo<HydratedResumeData | null>(() => {
    // No resume data uploaded yet
    if (!resumeData?.data?.extractedData?.parsed) {
      return null
    }

    const parsed: BackendParsedData = resumeData.data.extractedData.parsed

    // Transform each section
    const about = transformAbout(parsed.about)
    const education = transformEducation(parsed.education)
    const experience = transformExperience(parsed.experience)
    const projects = transformProjects(parsed.projects)
    
    // Skills - categorize into languages vs technologies
    const skills: SkillsData = categorizeSkills(parsed.skills || [])
    
    // Communication - extract from multiple fields
    const communication = transformCommunication(parsed)

    return {
      about,
      education,
      experience,
      projects,
      skills,
      communication,
    }
  }, [resumeData])

  /**
   * Mark that we've applied the hydrated data
   * Prevents re-application on re-renders
   */
  const markAsHydrated = () => {
    setHasHydrated(true)
  }

  return {
    hydratedData,
    hasHydrated,
    markAsHydrated,
  }
}