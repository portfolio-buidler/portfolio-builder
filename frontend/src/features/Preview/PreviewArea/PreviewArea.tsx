// PreviewArea.tsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { PreviewAreaView } from './PreviewArea.view'
import type { PreviewSection, SkillsData, CommunicationData } from './PreviewArea.types'
import { useResumeHydration } from './hooks/useResumeHydration.ts'

/**
 * PreviewArea Container Component
 * 
 * Main container for the preview page. Manages:
 * - Section content and completion state
 * - Undo/redo history
 * - Skills and communication data
 * - Navigation and edit mode
 * - Resume data hydration from uploaded CV
 */
const PreviewArea: React.FC = () => {
  const navigate = useNavigate()

  /* ========================================================================
     RESUME HYDRATION
     Load parsed CV data from store and transform to frontend format
     ======================================================================== */

  const { hydratedData, hasHydrated, markAsHydrated } = useResumeHydration()

  /* ========================================================================
     INITIAL DATA (with hydration support)
     ======================================================================== */

  // Use hydrated data if available, otherwise use empty defaults
  const initialSkillsData: SkillsData = hydratedData?.skills || {
    languages: [],
    technologies: [],
  }

  const initialCommunicationData: CommunicationData = hydratedData?.communication || {
    mobile: null,
    email: null,
    links: [],
  }

  // Build initial sections with hydrated content
  const getInitialSections = (): PreviewSection[] => {
    const aboutContent = hydratedData?.about || ''
    const educationContent = hydratedData?.education || ''
    const experienceContent = hydratedData?.experience || ''
    const projectsContent = hydratedData?.projects || ''

    return [
      {
        id: 'about',
        title: 'About Me',
        content: aboutContent ? <p style={{ whiteSpace: 'pre-wrap' }}>{aboutContent}</p> : '',
        required: true,
        complete: aboutContent.length > 0,
      },
      {
        id: 'education',
        title: 'Education',
        content: educationContent,
        required: true,
        complete: educationContent.length > 0,
      },
      {
        id: 'skills',
        title: 'Skills',
        content: null,
        required: true,
        complete: true, // Completion checked separately via isSkillsComplete
      },
      {
        id: 'communication',
        title: 'Communication',
        content: null,
        required: true,
        complete: true, // Completion checked separately via isCommunicationComplete
      },
      {
        id: 'experience',
        title: 'Work Experience',
        content: experienceContent,
        required: false,
        complete: experienceContent.length > 0,
      },
      {
        id: 'projects',
        title: 'Projects',
        content: projectsContent,
        required: false,
        complete: projectsContent.length > 0,
      },
    ]
  }

  /* ========================================================================
     STATE
     ======================================================================== */

  // Initialize sections with hydrated data on first render
  const [initialSections] = React.useState<PreviewSection[]>(getInitialSections)

  // History for undo/redo functionality
  const [history, setHistory] = React.useState<PreviewSection[][]>([initialSections])
  const [historyIndex, setHistoryIndex] = React.useState(0)

  // Skills and Communication data
  const [skillsData, setSkillsData] = React.useState<SkillsData>(initialSkillsData)
  const [communicationData, setCommunicationData] = React.useState<CommunicationData>(
    initialCommunicationData
  )

  // Education section expand/collapse state
  const [educationExpanded, setEducationExpanded] = React.useState(false)

  // Skills section expand/collapse state
  const [skillsExpanded, setSkillsExpanded] = React.useState(false)

  // Communication section expand/collapse state
  const [communicationExpanded, setCommunicationExpanded] = React.useState(false)

  // Edit mode tracking
  const [editingSectionId, setEditingSectionId] = React.useState<string | null>(null)

  /* ========================================================================
     HYDRATION EFFECT
     Mark as hydrated after initial mount to prevent re-hydration
     ======================================================================== */

  React.useEffect(() => {
    if (hydratedData && !hasHydrated) {
      markAsHydrated()
      console.log('[PreviewArea] Resume data hydrated successfully', {
        about: hydratedData.about.length > 0,
        education: hydratedData.education.length > 0,
        experience: hydratedData.experience.length > 0,
        projects: hydratedData.projects.length > 0,
        skills: hydratedData.skills,
        communication: hydratedData.communication,
      })
    }
  }, [hydratedData, hasHydrated, markAsHydrated])

  /* ========================================================================
     COMPUTED VALUES
     ======================================================================== */

  const currentSections = history[historyIndex]
  const undoAvailable = historyIndex > 0
  const redoAvailable = historyIndex < history.length - 1

  // Check if skills section is complete
  const isSkillsComplete = skillsData.languages.length > 0 || skillsData.technologies.length > 0

  // Check if communication section is complete
  const isCommunicationComplete =
    communicationData.mobile !== null ||
    communicationData.email !== null ||
    communicationData.links.length > 0

  // Check if all required sections are complete
  const isNextEnabled = React.useMemo(() => {
    const sectionsComplete = currentSections
      .filter((s) => s.required && s.id !== 'skills' && s.id !== 'communication')
      .every((s) => s.complete)

    return sectionsComplete && isSkillsComplete && isCommunicationComplete
  }, [currentSections, isSkillsComplete, isCommunicationComplete])

  /* ========================================================================
     NAVIGATION HANDLERS
     ======================================================================== */

  const handlePageBack = React.useCallback(() => {
    navigate(-1)
  }, [navigate])

  const handleNext = React.useCallback(() => {
    navigate('/next-step')
  }, [navigate])

  /* ========================================================================
     HISTORY HANDLERS (Undo/Redo)
     ======================================================================== */

  const handleUndo = React.useCallback(() => {
    if (undoAvailable) {
      setHistoryIndex((i) => i - 1)
    }
  }, [undoAvailable])

  const handleRedo = React.useCallback(() => {
    if (redoAvailable) {
      setHistoryIndex((i) => i + 1)
    }
  }, [redoAvailable])

  /* ========================================================================
     EDUCATION SECTION HANDLERS
     ======================================================================== */

  const handleToggleEducation = React.useCallback(() => {
    setEducationExpanded((prev) => !prev)
  }, [])

  /* ========================================================================
     SKILLS SECTION HANDLERS
     ======================================================================== */

  const handleToggleSkills = React.useCallback(() => {
    setSkillsExpanded(prev => {
      const next = !prev
      if (next) setCommunicationExpanded(false)
      return next
    })
  }, [])

  /* ========================================================================
     COMMUNICATION SECTION HANDLERS
     ======================================================================== */

  const handleToggleCommunication = React.useCallback(() => {
    setCommunicationExpanded(prev => {
      const next = !prev
      if (next) setSkillsExpanded(false)
      return next
    })
  }, [])

  /* ========================================================================
     EDIT MODE HANDLERS
     ======================================================================== */

  const handleEditSectionStart = React.useCallback((sectionId: string) => {
    setEditingSectionId(sectionId)
  }, [])

  const handleEditSectionEnd = React.useCallback(() => {
    setEditingSectionId(null)
  }, [])

  /**
   * Handle content changes for editable sections.
   * Creates a new history snapshot for undo/redo support.
   * 
   * Content storage strategy:
   * - About: JSX with pre-wrap for line break preservation
   * - Education: Raw string (parsed by EducationSection component)
   */
  const handleSectionContentChange = React.useCallback(
    (sectionId: string, content: string) => {
      const updated = currentSections.map((section) => {
        if (section.id !== sectionId) return section
        return {
          ...section,
          content:
            sectionId === 'about' ? <p style={{ whiteSpace: 'pre-wrap' }}>{content}</p> : content,
          complete: content.trim().length > 0,
        }
      })

      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(updated)
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
    },
    [currentSections, history, historyIndex]
  )

  /* ========================================================================
     RENDER
     ======================================================================== */

  return (
    <PreviewAreaView
      sections={currentSections}
      onPageBack={handlePageBack}
      onNext={handleNext}
      onUndo={handleUndo}
      onRedo={handleRedo}
      undoAvailable={undoAvailable}
      redoAvailable={redoAvailable}
      isNextEnabled={isNextEnabled}
      onToggleEducation={handleToggleEducation}
      isEducationExpanded={educationExpanded}
      onToggleSkills={handleToggleSkills}
      isSkillsExpanded={skillsExpanded}
      onToggleCommunication={handleToggleCommunication}
      isCommunicationExpanded={communicationExpanded}
      editingSectionId={editingSectionId}
      onEditSectionStart={handleEditSectionStart}
      onEditSectionEnd={handleEditSectionEnd}
      onSectionContentChange={handleSectionContentChange}
      skillsData={skillsData}
      onSkillsDataChange={setSkillsData}
      isSkillsComplete={isSkillsComplete}
      communicationData={communicationData}
      onCommunicationDataChange={setCommunicationData}
      isCommunicationComplete={isCommunicationComplete}
    />
  )
}

export default PreviewArea