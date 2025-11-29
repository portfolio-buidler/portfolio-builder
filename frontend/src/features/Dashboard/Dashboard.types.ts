// Dashboard.types.ts
import type { ReactNode } from 'react'

/**
 * User data for the dashboard
 */
export interface DashboardUser {
  name: string
  plan: 'Basic' | 'Pro' | 'Enterprise'
  avatarUrl?: string
}

/**
 * Menu item for the sidebar
 */
export interface SidebarMenuItem {
  id: string
  label: string
  icon: ReactNode
  onClick?: () => void
  isActive?: boolean
}

/**
 * Edit mode for the resume editor
 */
export type EditorMode = 'edit' | 'display'

/**
 * Section data for resume
 */
export interface ResumeSection {
  id: string
  type: 'header' | 'about' | 'projects' | 'education' | 'skills' | 'experience'
  content: unknown
  isEditable?: boolean
}

/**
 * Project data
 */
export interface ProjectData {
  id: string
  name: string
  description: string
  year: string
  tags: string[]
  imageUrl?: string
}

/**
 * Education data
 */
export interface EducationData {
  degree: string
  institution: string
  years: string
  details: string[]
}

/**
 * Work Experience data
 */
export interface WorkExperienceData {
  id: string
  role: string
  company: string
  years: string
  description: string
  achievements?: string[]
}

/**
 * Resume data structure
 */
export interface ResumeData {
  fullName: string
  title: string
  headline: string
  avatarUrl?: string
  about: string
  projects: ProjectData[]
  education: EducationData[]
  skills: string[]
  workExperience: WorkExperienceData[]
}

/**
 * Dashboard container props
 */
export interface DashboardProps {
  // No props needed currently
}

/**
 * Dashboard view props
 */
export interface DashboardViewProps {
  backgroundUrl: string
  user: DashboardUser
  menuItems: SidebarMenuItem[]
  activeMenuItem: string
  onMenuItemClick: (id: string) => void
  onSave: () => void
  isSaving: boolean
  
  // Editor toolbar
  mode: EditorMode
  onModeChange: (mode: EditorMode) => void
  onUndo: () => void
  onRedo: () => void
  undoAvailable: boolean
  redoAvailable: boolean
  onColorClick: () => void
  onTypographyClick: () => void
  
  // Resume content
  resumeData: ResumeData
  onResumeDataChange: (data: ResumeData) => void
}

/**
 * Sidebar props
 */
export interface SidebarProps {
  user: DashboardUser
  menuItems: SidebarMenuItem[]
  activeMenuItem: string
  onMenuItemClick: (id: string) => void
  onSave: () => void
  isSaving: boolean
  onNeedHelp: () => void
  isOpen?: boolean // For mobile drawer state
}

/**
 * Editor toolbar props
 */
export interface EditorToolbarProps {
  mode: EditorMode
  onModeChange: (mode: EditorMode) => void
  onUndo: () => void
  onRedo: () => void
  undoAvailable: boolean
  redoAvailable: boolean
  onColorClick: () => void
  onTypographyClick: () => void
}

/**
 * Resume preview props (display mode)
 */
export interface ResumePreviewProps {
  data: ResumeData
  mode: EditorMode
  onDataChange?: (data: ResumeData) => void
}

