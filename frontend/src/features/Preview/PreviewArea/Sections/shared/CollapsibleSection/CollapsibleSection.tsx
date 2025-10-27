import React from 'react'
import CollapsibleSectionView from './CollapsibleSection.view.tsx'
import type { Entry, CollapsibleSectionProps } from './CollapsibleSection.types'

/** Split entries by blank line. */
function splitEntries(raw: string): string[] {
  return raw
    .split(/\r?\n\s*\r?\n/) // two line breaks with optional whitespace
    .map(s => s.trim())
    .filter(Boolean)
}

function parseEntry(block: string): Entry {
  const lines = block.split(/\r?\n/)
  const first = (lines[0] || '').trim()

  // split on en dash or hyphen surrounded by spaces
  const dashSep = first.split(/\s+[–-]\s+/)
  let field1 = ''
  let field2 = ''
  let years = ''

  if (dashSep.length >= 2) {
    field1 = dashSep[0]?.trim() ?? ''
    const rest = dashSep.slice(1).join(' - ').trim()
    const yearsMatch = rest.match(/\(([^)]+)\)\s*$/)
    if (yearsMatch) {
      years = yearsMatch[1].trim()
      field2 = rest.replace(/\([^)]+\)\s*$/, '').trim()
    } else {
      field2 = rest
    }
  } else {
    // fallback if user typed without dashes
    const yearsMatch = first.match(/\(([^)]+)\)\s*$/)
    if (yearsMatch) {
      years = yearsMatch[1].trim()
      field1 = first.replace(/\([^)]+\)\s*$/, '').trim()
    } else {
      field1 = first
    }
  }

  const bullets = lines
    .slice(1)
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .filter(l => /^[•\-*]\s+/.test(l) || /^\d+\.\s+/.test(l))
    .map(l => l.replace(/^[•\-*]\s+|\d+\.\s+/, '').trim())
    .map(text => ({ text }))

  return { field1, field2, years, bullets }
}

/** Parse all entries from raw text. */
function parseAll(raw: string): Entry[] {
  return splitEntries(raw).map(parseEntry)
}

const COLLAPSED_MAX_HEIGHT_CSS = 110 // matches SCSS $collapsed-height

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  content,
  fieldLabels,
  className = '',
  isEditing: isEditingProp,
  isExpanded: isExpandedProp,
  onToggleExpanded,
  onEditStart,
  onEditEnd,
  onContentChange,
}) => {
  const sectionRef = React.useRef<HTMLElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // uncontrolled fallbacks
  const [editingLocal, setEditingLocal] = React.useState<boolean>(!!isEditingProp)
  const isEditing = typeof isEditingProp === 'boolean' ? isEditingProp : editingLocal

  const [expandedLocal, setExpandedLocal] = React.useState<boolean>(!!isExpandedProp)
  const isExpanded = typeof isExpandedProp === 'boolean' ? isExpandedProp : expandedLocal

  const [editValue, setEditValue] = React.useState<string>(content ?? '')
  React.useEffect(() => { if (typeof content === 'string') setEditValue(content) }, [content])

  const [entries, setEntries] = React.useState<Entry[]>(() => parseAll(editValue))

  const [savedExpandedHeight, setSavedExpandedHeight] = React.useState<number>(0)

  /** Auto-size textarea as you type; also lets the section grow naturally in edit mode. */
  const autosizeTextarea = React.useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [])

  React.useLayoutEffect(() => {
    if (isEditing) autosizeTextarea()
  }, [isEditing, editValue, autosizeTextarea])

  /** Double-click enters edit mode. */
  const handleEnterEdit = React.useCallback(() => {
    if (typeof isEditingProp !== 'boolean') setEditingLocal(true)
    onEditStart?.()
  }, [isEditingProp, onEditStart])

  React.useEffect(() => {
    if (!isEditing) return
    const onDown = (ev: MouseEvent) => {
      const root = sectionRef.current
      if (!root) return
      if (ev.target instanceof Node && root.contains(ev.target)) return

      // finalize save on outside click
      const parsed = parseAll(editValue)
      setEntries(parsed)

      // capture the height of the content box (textarea height in edit mode)
      const el = contentRef.current
      const height = el ? el.scrollHeight : 0
      setSavedExpandedHeight(Math.max(height, COLLAPSED_MAX_HEIGHT_CSS))

      if (typeof isEditingProp !== 'boolean') setEditingLocal(false)
      onEditEnd?.({ content: editValue, entries: parsed, savedExpandedHeight: height })
    }

    // small delay to avoid immediate capture from the double-click release
    const t = setTimeout(() => {
      document.addEventListener('mousedown', onDown, true)
    }, 80)

    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', onDown, true)
    }
  }, [isEditing, editValue, isEditingProp, onEditEnd])


  React.useEffect(() => {
    if (isEditing) return
    if (!isExpanded) return
    const el = contentRef.current
    if (!el) return
    
    // Temporarily remove max-height constraint to measure true height
    const originalMaxHeight = el.style.maxHeight
    const originalOverflow = el.style.overflow
    el.style.maxHeight = 'none'
    el.style.overflow = 'visible'
    
    // Force reflow to ensure styles are applied
    el.offsetHeight
    
    const measured = el.scrollHeight
    
    // Restore original styles
    el.style.maxHeight = originalMaxHeight
    el.style.overflow = originalOverflow
    
    if (measured <= 0) return
    const nextHeight = Math.max(measured, COLLAPSED_MAX_HEIGHT_CSS)
    if (nextHeight === savedExpandedHeight) return
    setSavedExpandedHeight(nextHeight)
  }, [isEditing, isExpanded, savedExpandedHeight])

  /** Toggle expand/collapse in view mode using saved height from the last edit session. */
  const handleToggle = React.useCallback(() => {
    if (isEditing) return
    const next = !isExpanded
    if (typeof isExpandedProp !== 'boolean') setExpandedLocal(next)
    onToggleExpanded?.(next)
  }, [isEditing, isExpanded, isExpandedProp, onToggleExpanded])

  /** Editing input handlers */
  const onEditChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    setEditValue(v)
    onContentChange?.(v)
    // nudge autosize
    setTimeout(autosizeTextarea, 0)
  }, [onContentChange, autosizeTextarea])

  /** Auto-bullet continuation */
  const onEditKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey) return
    const ta = e.currentTarget
    const cursor = ta.selectionStart
    const before = editValue.slice(0, cursor)
    const lineStart = before.lastIndexOf('\n') + 1
    const line = before.slice(lineStart)
    const m = line.match(/^(\s*)([-•*]|\d+\.)\s/)
    if (!m) return
    e.preventDefault()
    const indent = m[1]
    const bullet = m[2]
    const insertion = `\n${indent}${bullet} `
    const next = editValue.slice(0, cursor) + insertion + editValue.slice(cursor)
    setEditValue(next)
    onContentChange?.(next)
    setTimeout(() => {
      const pos = cursor + insertion.length
      ta.setSelectionRange(pos, pos)
      autosizeTextarea()
    }, 0)
  }, [editValue, onContentChange, autosizeTextarea])

  return (
    <CollapsibleSectionView
      ref={sectionRef}
      title={title}
      className={className}
      fieldLabels={fieldLabels}
      isEditing={isEditing}
      isExpanded={isExpanded}
      savedExpandedHeight={savedExpandedHeight}
      onEnterEdit={handleEnterEdit}
      onToggle={handleToggle}
      editValue={editValue}
      onEditChange={onEditChange}
      onEditKeyDown={onEditKeyDown}
      contentRef={contentRef}
      textareaRef={textareaRef}
      entries={entries}
    />
  )
}

export default CollapsibleSection
