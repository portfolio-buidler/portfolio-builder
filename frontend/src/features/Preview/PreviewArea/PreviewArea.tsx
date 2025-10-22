import React from 'react'
import { useNavigate } from 'react-router-dom'
import { PreviewAreaView } from './PreviewArea.view'
import type { PreviewSection } from './PreviewArea.types'

/**
 * Smart container component for the preview area. In a real
 * implementation this component would subscribe to your global
 * resume/curriculum vitae store and derive the contents of each
 * section as well as whether it is complete. For demonstration
 * purposes we construct a static set of sections that mirror the
 * example provided in the specification.
 */
const PreviewArea: React.FC = () => {
  const navigate = useNavigate()

  /**
   * Define the initial content for each section of the preview. In the real
   * application these values should be derived from the user’s uploaded
   * CV or the data they input during the editing flow. Each section
   * includes a title and JSX content. A required flag marks
   * which sections gate the Next button.
   */
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
      // Render the languages and technologies as individual tags for
      // improved readability. Each tag is styled in PreviewArea.styles.scss.
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
      // Display phone and email as pill‑like inputs and links as tags. The
      // values here serve as initial examples and should come from user
      // data in a real implementation.
      content: (
        <div className="preview-communication">
          <p>
            <strong>Mobile:</strong>{' '}
            <span className="preview-field">+972 8887657</span>
          </p>
          <p>
            <strong>Email:</strong>{' '}
            <span className="preview-field">yoadmadmonoj@gmail.com</span>
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
            <strong>Full‑Stack Developer – TechWave Solutions (2021–Present)</strong>
          </p>
          <ul>
            <li>
              Designed and implemented a customer portal that serves over ten
              thousand active users
            </li>
            <li>
              Led the transition from a monolithic PHP system to a microservices
              architecture with Node.js
            </li>
            <li>
              Collaborated with UX/UI designers to craft responsive, accessible
              interfaces
            </li>
          </ul>
        </div>
      ),
      required: false,
      complete: true,
    },
  ]

  // Maintain a history of section arrays to support undo/redo. Each
  // entry in the history represents a snapshot of the preview data
  // following an edit. For the MVP we seed the history with the initial
  // sections only. When edits are made (e.g. adding a link), a new
  // snapshot should be pushed to history and historyIndex advanced.
  const [history, setHistory] = React.useState<PreviewSection[][]>([initialSections])
  const [historyIndex, setHistoryIndex] = React.useState(0)

  // Track whether the education section is expanded. When true the
  // full content is visible; when false it's collapsed to default height.
  const [educationExpanded, setEducationExpanded] = React.useState(false)

  // Track which section is currently being edited
  const [editingSectionId, setEditingSectionId] = React.useState<string | null>(null)

  // Compute derived values for convenience
  const currentSections = history[historyIndex]
  const undoAvailable = historyIndex > 0
  const redoAvailable = historyIndex < history.length - 1

  // Determine whether all required sections are complete. If any required
  // section is missing or incomplete the user won’t be able to proceed.
  const isNextEnabled = currentSections
    .filter((s) => s.required)
    .every((s) => s.complete)

  /**
   * Navigate one step back in the browser history. In the real app this
   * would return the user to the CV upload page. This handler is
   * assigned to the back arrow in the page header.
   */
  const handlePageBack = () => {
    navigate(-1)
  }

  /**
   * Advance to the next step of the wizard. Replace the placeholder
   * route with your actual route name when integrating.
   */
  const handleNext = () => {
    navigate('/next-step')
  }

  /**
   * Step backwards through the edit history if available. When the
   * historyIndex is greater than 0 this decrements the index.
   */
  const handleUndo = () => {
    if (undoAvailable) {
      setHistoryIndex((i) => i - 1)
    }
  }

  /**
   * Step forwards through the edit history if available. When the
   * historyIndex is less than the last index this increments the index.
   */
  const handleRedo = () => {
    if (redoAvailable) {
      setHistoryIndex((i) => i + 1)
    }
  }

  /**
   * Toggle the expanded state of the education section. When collapsed
   * (expanded=false) the section shows default height. When expanded
   * (expanded=true) the full content is visible.
   */
  const handleToggleEducation = () => {
    setEducationExpanded((prev) => !prev)
  }

  /**
   * Handle adding a new link in the communication section. For
   * demonstration purposes this function appends a dummy link entry
   * labelled “New Link” to the list of links and records a new history
   * snapshot. In a real application you would prompt the user for the
   * link and update the appropriate data structure.
   */
  const handleAddLink = () => {
    // Append a new link as a tag to the communication section. We wrap
    // the existing content in a div and append a new <span> element. In
    // a production implementation you would likely update a structured
    // data model instead of manipulating JSX directly.
    const updated = currentSections.map((section) => {
      if (section.id !== 'communication') return section
      return {
        ...section,
        content: (
          <div>
            {section.content}
            <span className="preview-tag">New Link</span>
          </div>
        ),
      }
    })
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(updated)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  /**
   * Start editing a specific section. Sets the editingSectionId to
   * the provided section ID.
   */
  const handleEditSectionStart = (sectionId: string) => {
    setEditingSectionId(sectionId)
  }

  /**
   * End editing mode. Clears the editingSectionId.
   */
  const handleEditSectionEnd = () => {
    setEditingSectionId(null)
  }

  /**
   * Handle content changes for a section while in edit mode.
   * Updates the section content and creates a new history snapshot.
   * Preserves line breaks by storing raw text and applying white-space: pre-wrap in CSS.
   * 
   * Different sections store content differently:
   * - About: Stores as JSX with pre-wrap style for line break preservation
   * - Education: Stores as raw string (parsed on render)
   */
  const handleSectionContentChange = (sectionId: string, content: string) => {
    const updated = currentSections.map((section) => {
      if (section.id !== sectionId) return section
      return {
        ...section,
        // Store content based on section type
        content:
          sectionId === 'about'
            ? <p style={{ whiteSpace: 'pre-wrap' }}>{content}</p>
            : content, // Education stores as raw string
      }
    })
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(updated)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

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