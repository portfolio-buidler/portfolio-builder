import React from 'react'
import { AboutSectionView } from './AboutSection.view'
import type { AboutSectionProps } from './AboutSection.types'

/**
 * Smart container component for the About section.
 * Manages edit/view mode state and content editing with character limit.
 * 
 * Edit Mode: Double-click to edit, auto-expanding textarea, exits on outside click
 * View Mode: Static content display with scrollable overflow
 */
export const AboutSection: React.FC<AboutSectionProps> = ({
  title,
  content,
  complete,
  isEditing,
  onEditStart,
  onEditEnd,
  onContentChange,
}) => {
  const sectionRef = React.useRef<HTMLElement>(null)
  const [editableContent, setEditableContent] = React.useState('')
  const previousEditingRef = React.useRef(isEditing)
  const MAX_CHARACTERS = 500

  /**
   * Extract text content from ReactNode (string or JSX)
   */
  const extractTextContent = React.useCallback((node: React.ReactNode): string => {
    if (typeof node === 'string') return node
    if (typeof node === 'number') return String(node)
    if (Array.isArray(node)) return node.map(extractTextContent).join('')
    if (React.isValidElement(node)) {
      return extractTextContent(node.props.children)
    }
    return ''
  }, [])

  // Initialize editable content only when transitioning to edit mode
  React.useEffect(() => {
    const wasNotEditing = !previousEditingRef.current
    const isNowEditing = isEditing

    if (wasNotEditing && isNowEditing) {
      const contentString = extractTextContent(content)
      setEditableContent(contentString)
    }

    previousEditingRef.current = isEditing
  }, [isEditing, content, extractTextContent])

  // Handle click outside to exit edit mode
  React.useEffect(() => {
    if (!isEditing) return

    const handleClickOutside = (event: MouseEvent) => {
      if (sectionRef.current && !sectionRef.current.contains(event.target as Node)) {
        onEditEnd?.()
      }
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEditing, onEditEnd])

  /**
   * Handle textarea content changes with character limit
   */
  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = event.target.value
    if (newContent.length <= MAX_CHARACTERS) {
      setEditableContent(newContent)
      onContentChange?.(newContent)
    }
  }

  /**
   * Handle section double-click to enter edit mode
   */
  const handleSectionDoubleClick = () => {
    if (!isEditing) {
      onEditStart?.()
    }
  }

  /**
   * Auto-resize textarea to fit content
   */
  const handleTextareaRef = (textarea: HTMLTextAreaElement | null) => {
    if (textarea && isEditing) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }

  return (
    <AboutSectionView
      ref={sectionRef}
      title={title}
      content={content}
      complete={complete}
      isEditing={isEditing}
      editableContent={editableContent}
      characterCount={editableContent.length}
      maxCharacters={MAX_CHARACTERS}
      onSectionDoubleClick={handleSectionDoubleClick}
      onTextChange={handleTextChange}
      onTextareaRef={handleTextareaRef}
    />
  )
}

export default AboutSection
