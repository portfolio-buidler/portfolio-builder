// SkillsSection.tsx
import React from 'react'
import { SkillsSectionView } from './SkillsSection.view'
import type { SkillsSectionProps, SkillsData } from './SkillsSection.types'

/**
 * Skills Section Container Component
 * 
 * Manages state and business logic for the Skills section including:
 * - Languages and technologies lists
 * - Add/remove/edit operations
 * - Edit mode state management
 * - Keyboard shortcuts and click-outside handling
 * 
 * @param props - Component props including title, initial data, and callbacks
 */
export const SkillsSection: React.FC<SkillsSectionProps> = ({ 
  title, 
  complete,
  skillsData,
  onSkillsDataChange
}) => {
  /* ========================================================================
     LOCAL STATE - UI Concerns Only
     ======================================================================== */
  
  // Track which item is selected (double-clicked) for removal
  const [selectedItem, setSelectedItem] = React.useState<{ 
    type: 'language' | 'technology', 
    index: number 
  } | null>(null)
  
  // Track which item is currently being edited
  const [editingItem, setEditingItem] = React.useState<{ 
    type: 'language' | 'technology', 
    index: number 
  } | null>(null)
  
  // Temporary value while editing (not committed until save)
  const [editValue, setEditValue] = React.useState('')
  
  // Ref for the input field to handle focus
  const inputRef = React.useRef<HTMLInputElement>(null)

  /* ========================================================================
     DATA HANDLERS - Update Parent State
     ======================================================================== */

  const handleAddLanguage = React.useCallback(() => {
    onSkillsDataChange({
      ...skillsData,
      languages: [...skillsData.languages, '']
    })
  }, [skillsData, onSkillsDataChange])

  const handleAddTechnology = React.useCallback(() => {
    onSkillsDataChange({
      ...skillsData,
      technologies: [...skillsData.technologies, '']
    })
  }, [skillsData, onSkillsDataChange])

  const handleRemoveLanguage = React.useCallback((index: number) => {
    onSkillsDataChange({
      ...skillsData,
      languages: skillsData.languages.filter((_, i) => i !== index)
    })
  }, [skillsData, onSkillsDataChange])

  const handleRemoveTechnology = React.useCallback((index: number) => {
    onSkillsDataChange({
      ...skillsData,
      technologies: skillsData.technologies.filter((_, i) => i !== index)
    })
  }, [skillsData, onSkillsDataChange])

  const handleChangeLanguage = React.useCallback((index: number, value: string) => {
    onSkillsDataChange({
      ...skillsData,
      languages: skillsData.languages.map((lang, i) => (i === index ? value : lang))
    })
  }, [skillsData, onSkillsDataChange])

  const handleChangeTechnology = React.useCallback((index: number, value: string) => {
    onSkillsDataChange({
      ...skillsData,
      technologies: skillsData.technologies.map((tech, i) => (i === index ? value : tech))
    })
  }, [skillsData, onSkillsDataChange])

  /* ========================================================================
     EDIT MODE HANDLERS
     ======================================================================== */

  /**
   * Handle double-click on a saved item to enable selection/removal
   */
  const handleDoubleClick = React.useCallback((
    type: 'language' | 'technology', 
    index: number
  ) => {
    const value = type === 'language' 
      ? skillsData.languages[index] 
      : skillsData.technologies[index]
    
    // Only allow double-click on saved (non-empty) items
    if (value.trim() !== '') {
      setSelectedItem({ type, index })
    }
  }, [skillsData])

  /**
   * Save the currently edited item
   */
  const handleSave = React.useCallback(() => {
    if (!editingItem) return

    if (editValue.trim()) {
      // Save the trimmed value
      if (editingItem.type === 'language') {
        handleChangeLanguage(editingItem.index, editValue.trim())
      } else {
        handleChangeTechnology(editingItem.index, editValue.trim())
      }
    } else {
      // Remove empty tag if user didn't type anything
      if (editingItem.type === 'language') {
        handleRemoveLanguage(editingItem.index)
      } else {
        handleRemoveTechnology(editingItem.index)
      }
    }
    
    setEditingItem(null)
    setEditValue('')
  }, [editingItem, editValue, handleChangeLanguage, handleChangeTechnology, 
      handleRemoveLanguage, handleRemoveTechnology])

  /**
   * Handle keyboard events during editing
   */
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      // Remove empty tag on escape
      if (editingItem) {
        if (editingItem.type === 'language') {
          handleRemoveLanguage(editingItem.index)
        } else {
          handleRemoveTechnology(editingItem.index)
        }
      }
      setEditingItem(null)
      setEditValue('')
    }
  }, [editingItem, handleSave, handleRemoveLanguage, handleRemoveTechnology])

  /**
   * Handle remove button click for selected items
   */
  const handleRemove = React.useCallback(() => {
    if (!selectedItem) return

    if (selectedItem.type === 'language') {
      handleRemoveLanguage(selectedItem.index)
    } else {
      handleRemoveTechnology(selectedItem.index)
    }
    
    setSelectedItem(null)
  }, [selectedItem, handleRemoveLanguage, handleRemoveTechnology])

  /* ========================================================================
     EFFECTS
     ======================================================================== */

  /**
   * Auto-edit when a new empty item is added
   */
  React.useEffect(() => {
    const lastLangIndex = skillsData.languages.length - 1
    const lastTechIndex = skillsData.technologies.length - 1

    if (lastLangIndex >= 0 && skillsData.languages[lastLangIndex] === '') {
      setEditingItem({ type: 'language', index: lastLangIndex })
      setEditValue('')
    } else if (lastTechIndex >= 0 && skillsData.technologies[lastTechIndex] === '') {
      setEditingItem({ type: 'technology', index: lastTechIndex })
      setEditValue('')
    }
  }, [skillsData.languages.length, skillsData.technologies.length])

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
    <SkillsSectionView
      title={title}
      complete={complete}
      languages={skillsData.languages}
      technologies={skillsData.technologies}
      selectedItem={selectedItem}
      editingItem={editingItem}
      editValue={editValue}
      inputRef={inputRef}
      onAddLanguage={handleAddLanguage}
      onAddTechnology={handleAddTechnology}
      onDoubleClick={handleDoubleClick}
      onEditValueChange={setEditValue}
      onKeyDown={handleKeyDown}
      onRemove={handleRemove}
    />
  )
}

export default SkillsSection