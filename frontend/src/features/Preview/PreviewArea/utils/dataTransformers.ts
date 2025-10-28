// src/features/Preview/PreviewArea/utils/dataTransformers.ts

/**
 * Data Transformation Utilities
 * 
 * Converts backend parsed CV data into formats expected by frontend components.
 * Each transformer handles a specific section of the resume.
 */

import type { CommunicationData } from '../PreviewArea.types'
import type { SkillsData } from '../PreviewArea.types'

// Backend data structure (from UploadResponse)
export interface BackendEducation {
  degree: string
  institution: string
  years: string
}

export interface BackendExperience {
  role: string
  company: string
  dates: string
  description: string
}

export interface BackendProject {
  project_name: string
  description: string
}

export interface BackendParsedData {
  name?: string
  email?: string
  phone?: string
  linkedin?: string
  github?: string
  about?: string
  skills?: string[]
  education?: BackendEducation[]
  experience?: BackendExperience[]
  projects?: BackendProject[]
}

/**
 * Transform About section
 * Direct passthrough - backend sends plain text, we use it as-is
 */
export function transformAbout(about?: string): string {
  return about?.trim() || ''
}

/**
 * Transform Education array into CollapsibleSection text format
 * 
 * Format:
 * Degree – Institution (Years)
 * - Bullet point 1
 * - Bullet point 2
 * 
 * [blank line]
 * 
 * Next Degree – Next Institution (Years)
 * - Bullet 3
 */
export function transformEducation(education?: BackendEducation[]): string {
  if (!education || education.length === 0) return ''
  
  return education
    .map((edu) => {
      const degree = edu.degree?.trim() || ''
      const institution = edu.institution?.trim() || ''
      const years = edu.years?.trim() || ''
      
      // Format: "Degree – Institution (Years)"
      let header = degree
      if (institution) {
        header += ` – ${institution}`
      }
      if (years) {
        header += ` (${years})`
      }
      
      return header
    })
    .filter(Boolean)
    .join('\n\n') // Double newline between entries
}

/**
 * Transform Experience array into CollapsibleSection text format
 * 
 * Format:
 * Role – Company (Dates)
 * • Bullet point from description
 * • Another bullet
 * 
 * [blank line]
 * 
 * Next Role – Next Company (Dates)
 * • Bullet 3
 */
export function transformExperience(experience?: BackendExperience[]): string {
  if (!experience || experience.length === 0) return ''
  
  return experience
    .map((exp) => {
      const role = exp.role?.trim() || ''
      const company = exp.company?.trim() || ''
      const dates = exp.dates?.trim() || ''
      const description = exp.description?.trim() || ''
      
      // Format: "Role – Company (Dates)"
      let header = role
      if (company) {
        header += ` – ${company}`
      }
      if (dates) {
        header += ` (${dates})`
      }
      
      // Use description as-is (already contains bullets from backend)
      if (description) {
        return `${header}\n${description}`
      }
      
      return header
    })
    .filter(Boolean)
    .join('\n\n') // Double newline between entries
}

/**
 * Transform Projects array into CollapsibleSection text format
 * 
 * Format:
 * Project Name (optional technology/dates if available)
 * Description text with bullet points
 * 
 * [blank line]
 * 
 * Next Project
 * Description
 */
export function transformProjects(projects?: BackendProject[]): string {
  if (!projects || projects.length === 0) return ''
  
  return projects
    .map((proj) => {
      const projectName = proj.project_name?.trim() || ''
      const description = proj.description?.trim() || ''
      
      // If project_name contains the full formatted line (Role – Company (Dates))
      // use it as header, otherwise just use project_name
      const header = projectName
      
      if (description) {
        return `${header}\n${description}`
      }
      
      return header
    })
    .filter(Boolean)
    .join('\n\n') // Double newline between entries
}

/**
 * Extract communication data from backend parsed response
 * Combines email, phone, linkedin, github into CommunicationData structure
 */
export function transformCommunication(parsed?: BackendParsedData): CommunicationData {
  if (!parsed) {
    return {
      mobile: null,
      email: null,
      links: [],
    }
  }
  
  const links: string[] = []
  
  // Add LinkedIn if available
  if (parsed.linkedin?.trim()) {
    links.push(parsed.linkedin.trim())
  }
  
  // Add GitHub if available
  if (parsed.github?.trim()) {
    links.push(parsed.github.trim())
  }
  
  return {
    mobile: parsed.phone?.trim() || null,
    email: parsed.email?.trim() || null,
    links,
  }
}

/**
 * Helper: Check if communication data has any content
 */
export function isCommunicationComplete(data: CommunicationData): boolean {
  return !!(data.mobile || data.email || data.links.length > 0)
}

/**
 * Helper: Check if skills data has any content
 */
export function isSkillsComplete(data: SkillsData): boolean {
  return !!(data.languages.length > 0 || data.technologies.length > 0)
}