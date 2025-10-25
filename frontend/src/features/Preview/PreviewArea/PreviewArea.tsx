import React from 'react'
import { useNavigate } from 'react-router-dom'
import { PreviewAreaView } from './PreviewArea.view'
import type { PreviewSection } from './PreviewArea.types'

const PreviewArea: React.FC = () => {
  const navigate = useNavigate()

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
      content: (
        <div className="preview-skills">
          <p>
            <strong>Languages:</strong>{' '}
            {['Hebrew', 'English'].map((lang) => (
              <span key={lang} className="preview-tag">
                {lang}
              </span>
            ))}
          </p>
          <p>
            <strong>Technologies:</strong>{' '}
            {[
              'React.js',
              'Next.js',
              'TypeScript',
              'Redux',
              'TailwindCSS',
              'Node.js',
              'Express',
              'MongoDB',
              'PostgreSQL',
              'Firebase',
            ].map((tech) => (
              <span key={tech} className="preview-tag">
                {tech}
              </span>
            ))}
          </p>
        </div>
      ),
      required: true,
      complete: true,
    },
    {
      id: 'communication',
      title: 'Communication',
      content: (
        <div className="preview-communication">
          <p>
            <strong>Mobile:</strong> <span className="preview-field">+972 8887657</span>
          </p>
          <p>
            <strong>Email:</strong> <span className="preview-field">yoadmadmonoj@gmail.com</span>
          </p>
          <p>
            <strong>Links:</strong>{' '}
            {['GitHub', 'LinkedIn', 'Instagram'].map((link) => (
              <span key={link} className="preview-tag">
                {link}
              </span>
            ))}
          </p>
        </div>
      ),
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
  ]

  /* ========================================================================
     STATE
     ======================================================================== */

  // History for undo/redo functionality
  const [history, setHistory] = React.useState<PreviewSection[][]>([initialSections])
  const [historyIndex, setHistoryIndex] = React.useState(0)

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
  const isNextEnabled = currentSections.filter((s) => s.required).every((s) => s.complete)

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
     COMMUNICATION SECTION HANDLERS
     ======================================================================== */

  const handleAddLink = React.useCallback(() => {
    const updated = currentSections.map((section) => {
      if (section.id !== 'communication') return section
      return {
        ...section,
        content: (
          <div>
            {section.content}
            <span className="preview-tag">New Link</span>
          </div>
        ),
      }
    })
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(updated)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [currentSections, history, historyIndex])

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
      onAddLink={handleAddLink}
      editingSectionId={editingSectionId}
      onEditSectionStart={handleEditSectionStart}
      onEditSectionEnd={handleEditSectionEnd}
      onSectionContentChange={handleSectionContentChange}
    />
  )
}

export default PreviewArea
