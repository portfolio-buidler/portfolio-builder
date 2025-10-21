import React from 'react'
import { EducationSectionView } from './EducationSection.view'
import type { EducationSectionProps, ParsedEducationContent } from './EducationSection.types'

/**
 * Smart container component for the Education section.
 * Manages edit/view mode state, content parsing, and toggle expand/collapse.
 * 
 * Content Format (raw string):
 * - Line 1: Degree
 * - Line 2: University
 * - Line 3: Years
 * - Line 4: Empty separator
 * - Lines 5+: Bullet points (starting with -, •, *, or 1.)
 * 
 * Edit Mode Behavior:
 * - Triggered by double-clicking on the section body
 * - Toggle button becomes invisible during edit mode
 * - Content becomes editable via single textarea
 * - Textarea auto-grows as content increases
 * - Exit by clicking outside the section
 * 
 * View Mode Behavior:
 * - Parsed content display (degree, university, years, bullets)
 * - Toggle button controls vertical expansion
 * - Click toggle → expands/collapses (does NOT enter edit mode)
 */
export const EducationSection: React.FC<EducationSectionProps> = ({
  title,
  content,
  complete,
  isExpanded,
  onToggle,
  isEditing,
  onEditStart,
  onEditEnd,
  onContentChange,
}) => {
  const sectionRef = React.useRef<HTMLElement>(null)
  const [textareaElement, setTextareaElement] = React.useState<HTMLTextAreaElement | null>(null)
  const [editableContent, setEditableContent] = React.useState('')

  /**
   * Parse education content from raw string into structured data.
   * 
   * Format:
   * Line 1: Degree
   * Line 2: University
   * Line 3: Years
   * Lines 4+: Bullet points (starting with -, •, *, or 1.)
   */
  const parseContent = (text: string): ParsedEducationContent => {
    const lines = text.split('\n').map((line) => line.trim())
    const degree = lines[0] || ''
    const university = lines[1] || ''
    const years = lines[2] || ''

    // Find bullet points (skip first 3 lines + empty line)
    const bulletPoints = lines
      .slice(4)
      .filter((line) => line.length > 0)
      .filter((line) => /^[•\-*]|\d+\./.test(line))
      .map((line) => line.replace(/^[•\-*]\s*|\d+\.\s*/, '').trim())

    return { degree, university, years, bulletPoints }
  }

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

  /**
   * Auto-resize textarea to fit content.
   * Sets height to 'auto' first to get correct scrollHeight, then applies it.
   */
  const adjustTextareaHeight = React.useCallback(() => {
    if (textareaElement) {
      textareaElement.style.height = 'auto'
      textareaElement.style.height = `${textareaElement.scrollHeight}px`
    }
  }, [textareaElement])

  // Adjust textarea height when entering edit mode or content changes
  React.useEffect(() => {
    if (isEditing && textareaElement) {
      adjustTextareaHeight()
    }
  }, [isEditing, textareaElement, adjustTextareaHeight])

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
   * Handle section double-click to enter edit mode
   */
  const handleSectionClick = () => {
    if (!isEditing) {
      onEditStart?.()
    }
  }

  /**
   * Handle textarea content changes
   */
  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = event.target.value
    setEditableContent(newContent)
    onContentChange?.(newContent)
    // Adjust height after state update
    setTimeout(adjustTextareaHeight, 0)
  }

  /**
   * Handle Enter key in textarea - auto-add bullet if on a bullet line
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      const textarea = event.currentTarget
      const cursorPosition = textarea.selectionStart
      const textBeforeCursor = editableContent.substring(0, cursorPosition)
      const currentLineStart = textBeforeCursor.lastIndexOf('\n') + 1
      const currentLine = textBeforeCursor.substring(currentLineStart)

      // Check if current line starts with a bullet
      const bulletMatch = currentLine.match(/^(\s*)([-•*]|\d+\.)\s/)
      if (bulletMatch) {
        event.preventDefault()
        const indent = bulletMatch[1]
        const bullet = bulletMatch[2]

        // Auto-add bullet on new line
        const newContent =
          editableContent.substring(0, cursorPosition) +
          '\n' +
          indent +
          bullet +
          ' ' +
          editableContent.substring(cursorPosition)

        setEditableContent(newContent)
        onContentChange?.(newContent)

        // Move cursor after new bullet
        setTimeout(() => {
          const newCursorPos = cursorPosition + indent.length + bullet.length + 2
          textarea.setSelectionRange(newCursorPos, newCursorPos)
          adjustTextareaHeight()
        }, 0)
      }
    }
  }

  /**
   * Callback ref for textarea - stores element and triggers height adjustment
   */
  const handleTextareaRef = (textarea: HTMLTextAreaElement | null) => {
    setTextareaElement(textarea)
    if (textarea && isEditing) {
      adjustTextareaHeight()
    }
  }

  return (
    <EducationSectionView
      ref={sectionRef}
      title={title}
      content={editableContent}
      parsedContent={parseContent(editableContent)}
      complete={complete}
      isExpanded={isExpanded}
      onToggle={onToggle}
      isEditing={isEditing}
      onSectionClick={handleSectionClick}
      onContentChange={handleContentChange}
      onTextareaRef={handleTextareaRef}
      onKeyDown={handleKeyDown}
    />
  )
}

export default EducationSection
