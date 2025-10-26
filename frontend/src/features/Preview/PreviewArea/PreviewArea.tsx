import React from 'react'
import { useNavigate } from 'react-router-dom'
import { PreviewAreaView } from './PreviewArea.view'
import type { PreviewSection, SkillsData, CommunicationData } from './PreviewArea.types'

const PreviewArea: React.FC = () => {
  const navigate = useNavigate()

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
      content: (
        <div>
          <p>
            <strong>Full‑Stack Developer – TechWave Solutions (2021–Present)</strong>
          </p>
          <ul>
            <li>Designed and implemented a customer portal serving 10,000+ active users</li>
            <li>Led transition from monolithic PHP to Node.js microservices architecture</li>
            <li>Collaborated with UX/UI designers to craft responsive, accessible interfaces</li>
          </ul>
        </div>
      ),
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
  const [communicationData, setCommunicationData] = React.useState<CommunicationData>(initialCommunicationData)

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
     SKILLS SECTION HANDLERS
     ======================================================================== */

  const handleAddLanguage = React.useCallback(() => {
    setSkillsData((prev) => ({
      ...prev,
      languages: [...prev.languages, ''],
    }))
  }, [])

  const handleAddTechnology = React.useCallback(() => {
    setSkillsData((prev) => ({
      ...prev,
      technologies: [...prev.technologies, ''],
    }))
  }, [])

  const handleRemoveLanguage = React.useCallback((index: number) => {
    setSkillsData((prev) => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index),
    }))
  }, [])

  const handleRemoveTechnology = React.useCallback((index: number) => {
    setSkillsData((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((_, i) => i !== index),
    }))
  }, [])

  const handleChangeLanguage = React.useCallback((index: number, value: string) => {
    setSkillsData((prev) => ({
      ...prev,
      languages: prev.languages.map((lang, i) => (i === index ? value : lang)),
    }))
  }, [])

  const handleChangeTechnology = React.useCallback((index: number, value: string) => {
    setSkillsData((prev) => ({
      ...prev,
      technologies: prev.technologies.map((tech, i) => (i === index ? value : tech)),
    }))
  }, [])


  /* ========================================================================
     COMMUNICATION SECTION HANDLERS
     ======================================================================== */

  const handleAddMobile = React.useCallback(() => {
    setCommunicationData((prev) => ({
      ...prev,
      mobile: '',
    }))
  }, [])

  const handleAddEmail = React.useCallback(() => {
    setCommunicationData((prev) => ({
      ...prev,
      email: '',
    }))
  }, [])

  const handleAddLink = React.useCallback(() => {
    setCommunicationData((prev) => ({
      ...prev,
      links: [...prev.links, ''],
    }))
  }, [])

  const handleRemoveMobile = React.useCallback(() => {
    setCommunicationData((prev) => ({
      ...prev,
      mobile: null,
    }))
  }, [])

  const handleRemoveEmail = React.useCallback(() => {
    setCommunicationData((prev) => ({
      ...prev,
      email: null,
    }))
  }, [])

  const handleRemoveLink = React.useCallback((index: number) => {
    setCommunicationData((prev) => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index),
    }))
  }, [])

  const handleChangeMobile = React.useCallback((value: string) => {
    setCommunicationData((prev) => ({
      ...prev,
      mobile: value,
    }))
  }, [])

  const handleChangeEmail = React.useCallback((value: string) => {
    setCommunicationData((prev) => ({
      ...prev,
      email: value,
    }))
  }, [])

  const handleChangeLink = React.useCallback((index: number, value: string) => {
    setCommunicationData((prev) => ({
      ...prev,
      links: prev.links.map((link, i) => (i === index ? value : link)),
    }))
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
          complete: content.trim().length > 0, // Mark complete if has content
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
      onAddLanguage={handleAddLanguage}
      onAddTechnology={handleAddTechnology}
      onRemoveLanguage={handleRemoveLanguage}
      onRemoveTechnology={handleRemoveTechnology}
      onChangeLanguage={handleChangeLanguage}
      onChangeTechnology={handleChangeTechnology}
      isSkillsComplete={isSkillsComplete}
      communicationData={communicationData}
      onAddMobile={handleAddMobile}
      onAddEmail={handleAddEmail}
      onAddLink={handleAddLink}
      onRemoveMobile={handleRemoveMobile}
      onRemoveEmail={handleRemoveEmail}
      onRemoveLink={handleRemoveLink}
      onChangeMobile={handleChangeMobile}
      onChangeEmail={handleChangeEmail}
      onChangeLink={handleChangeLink}
      isCommunicationComplete={isCommunicationComplete}
    />
  )
}

export default PreviewArea