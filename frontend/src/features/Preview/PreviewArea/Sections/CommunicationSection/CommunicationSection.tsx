// CommunicationSection.tsx
import React from 'react'
import { CommunicationSectionView } from './CommunicationSection.view'
import type { CommunicationSectionProps } from './CommunicationSection.types'

/**
 * Communication Section Container Component
 * 
 * Manages state and business logic for the Communication section including:
 * - Mobile, email, and links fields
 * - Add/remove/edit operations
 * - Edit mode state management
 * - Auto-expand/collapse during editing
 * - Keyboard shortcuts and click-outside handling
 * 
 * @param props - Component props including title, initial data, and callbacks
 */
export const CommunicationSection: React.FC<CommunicationSectionProps> = ({
  title,
  complete,
  communicationData,
  onCommunicationDataChange,
  isExpanded: isExpandedProp,
  onToggleExpanded
}) => {
  /* ========================================================================
     LOCAL STATE - UI Concerns Only
     ======================================================================== */
  
  // Track which item is selected (double-clicked) for removal
  const [selectedItem, setSelectedItem] = React.useState<{ 
    type: 'mobile' | 'email' | 'link', 
    index?: number 
  } | null>(null)
  
  // Track which item is currently being edited
  const [editingItem, setEditingItem] = React.useState<{ 
    type: 'mobile' | 'email' | 'link', 
    index?: number 
  } | null>(null)
  
  // Temporary value while editing (not committed until save)
  const [editValue, setEditValue] = React.useState('')
  
  // Ref for the input field to handle focus
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Internal expanded state for auto-expand during editing
  const [autoExpanded, setAutoExpanded] = React.useState(false)

  // Ref to track content height
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Determine if section should be expanded (manual toggle OR auto-expand during edit)
  const isExpanded = isExpandedProp || autoExpanded

  /* ========================================================================
     DATA HANDLERS - Update Parent State
     ======================================================================== */

  const handleAddMobile = React.useCallback(() => {
    onCommunicationDataChange({
      ...communicationData,
      mobile: ''
    })
  }, [communicationData, onCommunicationDataChange])

  const handleAddEmail = React.useCallback(() => {
    onCommunicationDataChange({
      ...communicationData,
      email: ''
    })
  }, [communicationData, onCommunicationDataChange])

  const handleAddLink = React.useCallback(() => {
    onCommunicationDataChange({
      ...communicationData,
      links: [...communicationData.links, '']
    })
  }, [communicationData, onCommunicationDataChange])

  const handleRemoveMobile = React.useCallback(() => {
    onCommunicationDataChange({
      ...communicationData,
      mobile: null
    })
  }, [communicationData, onCommunicationDataChange])

  const handleRemoveEmail = React.useCallback(() => {
    onCommunicationDataChange({
      ...communicationData,
      email: null
    })
  }, [communicationData, onCommunicationDataChange])

  const handleRemoveLink = React.useCallback((index: number) => {
    onCommunicationDataChange({
      ...communicationData,
      links: communicationData.links.filter((_, i) => i !== index)
    })
  }, [communicationData, onCommunicationDataChange])

  const handleChangeMobile = React.useCallback((value: string) => {
    onCommunicationDataChange({
      ...communicationData,
      mobile: value
    })
  }, [communicationData, onCommunicationDataChange])

  const handleChangeEmail = React.useCallback((value: string) => {
    onCommunicationDataChange({
      ...communicationData,
      email: value
    })
  }, [communicationData, onCommunicationDataChange])

  const handleChangeLink = React.useCallback((index: number, value: string) => {
    onCommunicationDataChange({
      ...communicationData,
      links: communicationData.links.map((link, i) => (i === index ? value : link))
    })
  }, [communicationData, onCommunicationDataChange])

  /* ========================================================================
     EDIT MODE HANDLERS
     ======================================================================== */

  /**
   * Handle double-click on a saved item to enable selection/removal
   */
  const handleDoubleClick = React.useCallback((
    type: 'mobile' | 'email' | 'link', 
    index?: number
  ) => {
    let value = ''
    if (type === 'mobile' && communicationData.mobile) {
      value = communicationData.mobile
    } else if (type === 'email' && communicationData.email) {
      value = communicationData.email
    } else if (type === 'link' && index !== undefined) {
      value = communicationData.links[index]
    }
    
    // Only allow double-click on saved (non-empty) items
    if (value.trim() !== '') {
      setSelectedItem({ type, index })
    }
  }, [communicationData.links, communicationData.mobile, communicationData.email]);

  /**
   * Save the currently edited item
   */
  const handleSave = React.useCallback(() => {
    if (!editingItem) return

    if (editValue.trim()) {
      // Save the trimmed value
      if (editingItem.type === 'mobile') {
        handleChangeMobile(editValue.trim())
      } else if (editingItem.type === 'email') {
        handleChangeEmail(editValue.trim())
      } else if (editingItem.type === 'link' && editingItem.index !== undefined) {
        handleChangeLink(editingItem.index, editValue.trim())
      }
    } else {
      // Remove empty field if user didn't type anything
      if (editingItem.type === 'mobile') {
        handleRemoveMobile()
      } else if (editingItem.type === 'email') {
        handleRemoveEmail()
      } else if (editingItem.type === 'link' && editingItem.index !== undefined) {
        handleRemoveLink(editingItem.index)
      }
    }
    
    setEditingItem(null)
    setEditValue('')
    
    // Auto-collapse after saving
    setAutoExpanded(false)
  }, [editingItem, editValue, handleChangeMobile, handleChangeEmail, handleChangeLink,
      handleRemoveMobile, handleRemoveEmail, handleRemoveLink])

  /**
   * Handle keyboard events during editing
   */
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      // Remove empty field on escape
      if (editingItem) {
        if (editingItem.type === 'mobile') {
          handleRemoveMobile()
        } else if (editingItem.type === 'email') {
          handleRemoveEmail()
        } else if (editingItem.type === 'link' && editingItem.index !== undefined) {
          handleRemoveLink(editingItem.index)
        }
      }
      setEditingItem(null)
      setEditValue('')
      
      // Auto-collapse on escape
      setAutoExpanded(false)
    }
  }, [editingItem, handleSave, handleRemoveMobile, handleRemoveEmail, handleRemoveLink])

  /**
   * Handle remove button click for selected items
   */
  const handleRemove = React.useCallback(() => {
    if (!selectedItem) return

    if (selectedItem.type === 'mobile') {
      handleRemoveMobile()
    } else if (selectedItem.type === 'email') {
      handleRemoveEmail()
    } else if (selectedItem.type === 'link' && selectedItem.index !== undefined) {
      handleRemoveLink(selectedItem.index)
    }
    
    setSelectedItem(null)
  }, [selectedItem, handleRemoveMobile, handleRemoveEmail, handleRemoveLink])

  /* ========================================================================
     AUTO-EXPAND/COLLAPSE LOGIC
     ======================================================================== */

  /**
   * Check if content overflows and auto-expand when editing starts
   */
  React.useEffect(() => {
    if (!editingItem) return

    // Check if content would overflow
    const checkOverflow = () => {
      const contentEl = contentRef.current
      if (!contentEl) return

      // Get the collapsed height (110px from SCSS)
      const collapsedHeight = 110
      const contentHeight = contentEl.scrollHeight

      // If content exceeds collapsed height, auto-expand
      if (contentHeight > collapsedHeight) {
        setAutoExpanded(true)
      }
    }

    // Small delay to ensure DOM has updated with new editing item
    const timer = setTimeout(checkOverflow, 50)
    return () => clearTimeout(timer)
  }, [editingItem])

  /**
   * Clear auto-expand when user manually collapses the section
   */
  React.useEffect(() => {
    if (isExpandedProp === false) {
      setAutoExpanded(false)
    }
  }, [isExpandedProp])

  /* ========================================================================
     EFFECTS
     ======================================================================== */

  /**
   * Auto-edit when a new empty field is added
   */
  React.useEffect(() => {
    if (communicationData.mobile === '') {
      setEditingItem({ type: 'mobile' })
      setEditValue('')
    } else if (communicationData.email === '') {
      setEditingItem({ type: 'email' })
      setEditValue('')
    } else {
      const lastLinkIndex = communicationData.links.length - 1
      if (lastLinkIndex >= 0 && communicationData.links[lastLinkIndex] === '') {
        setEditingItem({ type: 'link', index: lastLinkIndex })
        setEditValue('')
      }
    }
  }, [communicationData.mobile, communicationData.email, communicationData.links])

  /**
   * Focus input when editing starts
   */
  React.useEffect(() => {
    if (editingItem && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingItem])

  /**
   * Handle clicks outside to save/deselect
   */
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (editingItem) {
        handleSave()
      }
      setSelectedItem(null)
    }
    
    if (editingItem || selectedItem) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [editingItem, selectedItem, handleSave])

  /* ========================================================================
     RENDER
     ======================================================================== */

  return (
    <CommunicationSectionView
      title={title}
      complete={complete}
      mobile={communicationData.mobile}
      email={communicationData.email}
      links={communicationData.links}
      selectedItem={selectedItem}
      editingItem={editingItem}
      editValue={editValue}
      inputRef={inputRef}
      contentRef={contentRef}
      onAddMobile={handleAddMobile}
      onAddEmail={handleAddEmail}
      onAddLink={handleAddLink}
      onDoubleClick={handleDoubleClick}
      onEditValueChange={setEditValue}
      onKeyDown={handleKeyDown}
      onRemove={handleRemove}
      isExpanded={isExpanded}
      onToggleExpanded={onToggleExpanded ? () => onToggleExpanded(!isExpandedProp) : undefined}
    />
  )
}

export default CommunicationSection
