import React from 'react'
import { AboutSectionView } from './AboutSection.view'
import type { AboutSectionProps } from './AboutSection.types'

/**
 * Smart container component for the About section.
 * Manages edit/view mode state and content editing logic.
 * 
 * Edit Mode Behavior:
 * - Triggered by clicking anywhere on the section
 * - Content becomes editable via textarea
 * - Section expands vertically to fit content (no height limit)
 * - Exit by clicking outside the section
 * 
 * View Mode Behavior:
 * - Static content display
 * - Fixed height (120px content area)
 * - Scrollable overflow if content exceeds height
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

  // Extract text content from ReactNode for editing
  React.useEffect(() => {
    if (typeof content === 'string') {
      setEditableContent(content)
    } else if (React.isValidElement(content)) {
      // Extract text from JSX
      const extractText = (node: React.ReactNode): string => {
        if (typeof node === 'string') return node
        if (typeof node === 'number') return String(node)
        if (Array.isArray(node)) return node.map(extractText).join('')
        if (React.isValidElement(node)) {
          return extractText(node.props.children)
        }
        return ''
      }
      setEditableContent(extractText(content))
    }
  }, [content])

  // Handle click outside to exit edit mode
  React.useEffect(() => {
    if (!isEditing) return

    const handleClickOutside = (event: MouseEvent) => {
      if (sectionRef.current && !sectionRef.current.contains(event.target as Node)) {
        onEditEnd?.()
      }
    }

    // Add listener with a small delay to avoid immediate trigger
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEditing, onEditEnd])

  /**
   * Handle section click to enter edit mode
   */
  const handleSectionClick = () => {
    if (!isEditing) {
      onEditStart?.()
    }
  }

  /**
   * Handle textarea content changes
   */
  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = event.target.value
    setEditableContent(newContent)
    onContentChange?.(newContent)
  }

  /**
   * Auto-resize textarea to fit content
   */
  const handleTextareaRef = (textarea: HTMLTextAreaElement | null) => {
    if (textarea && isEditing) {
      // Reset height to auto to get the correct scrollHeight
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
      onSectionClick={handleSectionClick}
      onTextChange={handleTextChange}
      onTextareaRef={handleTextareaRef}
    />
  )
}

export default AboutSection
