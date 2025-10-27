// PreviewArea.tsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { PreviewAreaView } from './PreviewArea.view'
import type { PreviewSection, SkillsData, CommunicationData } from './PreviewArea.types'

/**
 * PreviewArea Container Component
 * 
 * Main container for the preview page. Manages:
 * - Section content and completion state
 * - Undo/redo history
 * - Skills and communication data
 * - Navigation and edit mode
 */
const PreviewArea: React.FC = () => {
  const navigate = useNavigate()

  /* ========================================================================
     INITIAL DATA
     ======================================================================== */

  const initialSkillsData: SkillsData = {
    languages: [],
    technologies: [],
  }

  const initialCommunicationData: CommunicationData = {
    mobile: null,
    email: null,
    links: [],
  }

  const initialSections: PreviewSection[] = [
    {
      id: 'about',
      title: 'About Me',
      content: '',
      required: true,
      complete: false,
    },
    {
      id: 'education',
      title: 'Education',
      content: '',
      required: true,
      complete: false,
    },
    {
      id: 'skills',
      title: 'Skills',
      content: null,
      required: true,
      complete: true,
    },
    {
      id: 'communication',
      title: 'Communication',
      content: null,
      required: true,
      complete: true,
    },
    {
      id: 'experience',
      title: 'Work Experience',
      content: null,
      required: false,
      complete: true,
    },
    {
      id: 'projects',
      title: 'Projects',
      content: '',
      required: false,
      complete: false,
    },
  ]

  /* ========================================================================
     STATE
     ======================================================================== */

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

  // Edit mode tracking
  const [editingSectionId, setEditingSectionId] = React.useState<string | null>(null)

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