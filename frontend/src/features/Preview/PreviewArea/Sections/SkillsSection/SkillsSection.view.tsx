// SkillsSection.view.tsx
import React from 'react'
import type { SkillsSectionProps } from './SkillsSection.types'
import questionMarkIcon from '../../../../../assets/icons/PreviewPage/question-mark.svg'

export const SkillsSection: React.FC<SkillsSectionProps> = ({ 
  title, 
  complete,
  languages,
  technologies,
  onAddLanguage,
  onAddTechnology,
  onRemoveLanguage,
  onRemoveTechnology,
  onChangeLanguage,
  onChangeTechnology
}) => {
  const [selectedItem, setSelectedItem] = React.useState<{ type: 'language' | 'technology', index: number } | null>(null)
  const [editingItem, setEditingItem] = React.useState<{ type: 'language' | 'technology', index: number } | null>(null)
  const [editValue, setEditValue] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Auto-edit when a new empty item is added
  React.useEffect(() => {
    const lastLangIndex = languages.length - 1
    const lastTechIndex = technologies.length - 1

    if (lastLangIndex >= 0 && languages[lastLangIndex] === '') {
      setEditingItem({ type: 'language', index: lastLangIndex })
      setEditValue('')
    } else if (lastTechIndex >= 0 && technologies[lastTechIndex] === '') {
      setEditingItem({ type: 'technology', index: lastTechIndex })
      setEditValue('')
    }
  }, [languages.length, technologies.length])

  // Focus input when editing starts
  React.useEffect(() => {
    if (editingItem && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingItem])

  const handleDoubleClick = (type: 'language' | 'technology', index: number) => {
    // Only allow double-click on saved (non-empty) items
    const value = type === 'language' ? languages[index] : technologies[index]
    if (value.trim() !== '') {
      setSelectedItem({ type, index })
    }
  }

  const handleSave = () => {
    if (editingItem && editValue.trim()) {
      if (editingItem.type === 'language') {
        onChangeLanguage(editingItem.index, editValue.trim())
      } else {
        onChangeTechnology(editingItem.index, editValue.trim())
      }
    } else if (editingItem && editValue.trim() === '') {
      // Remove empty tag if user didn't type anything
      if (editingItem.type === 'language') {
        onRemoveLanguage(editingItem.index)
      } else {
        onRemoveTechnology(editingItem.index)
      }
    }
    setEditingItem(null)
    setEditValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      // Remove empty tag on escape
      if (editingItem) {
        if (editingItem.type === 'language') {
          onRemoveLanguage(editingItem.index)
        } else {
          onRemoveTechnology(editingItem.index)
        }
      }
      setEditingItem(null)
      setEditValue('')
    }
  }

  const handleRemove = () => {
    if (selectedItem) {
      if (selectedItem.type === 'language') {
        onRemoveLanguage(selectedItem.index)
      } else {
        onRemoveTechnology(selectedItem.index)
      }
      setSelectedItem(null)
    }
  }

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
  }, [editingItem, selectedItem, editValue])

  return (
    <section
      className="preview-section preview-section--skills"
      data-complete={complete}
    >
      <div className="preview-section__title-container">
        <h3 className="preview-section__title">{title}</h3>
        <img src={questionMarkIcon} alt="Help" className="preview-section__help-icon" />
      </div>

      <div className="preview-section__content">
        {/* Languages */}
        <div className="preview-skills__row">
          <span className="preview-skills__label">Languages:</span>
          <div className="preview-skills__items">
            {languages.length > 0 ? (
              <>
                {languages.map((lang, index) => (
                  <React.Fragment key={`lang-${index}`}>
                    {editingItem?.type === 'language' && editingItem?.index === index ? (
                      <input
                        ref={inputRef}
                        type="text"
                        className="preview-tag preview-tag--editing"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Type here..."
                        aria-label="Edit language"
                      />
                    ) : (
                      lang !== '' && (
                        <span
                          className={`preview-tag ${selectedItem?.type === 'language' && selectedItem?.index === index ? 'preview-tag--selected' : ''}`}
                          onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick('language', index) }}
                        >
                          {lang}
                          {selectedItem?.type === 'language' && selectedItem?.index === index && (
                            <button
                              className="preview-tag__remove"
                              onClick={(e) => { e.stopPropagation(); handleRemove() }}
                              aria-label="Remove language"
                            >
                              −
                            </button>
                          )}
                        </span>
                      )
                    )}
                  </React.Fragment>
                ))}
                <button
                  type="button"
                  className="preview-tag preview-tag--add"
                  onClick={onAddLanguage}
                  aria-label="Add another language"
                >
                  +
                </button>
              </>
            ) : (
              <button
                type="button"
                className="preview-tag preview-tag--add"
                onClick={onAddLanguage}
                aria-label="Add language"
              >
                +
              </button>
            )}
          </div>
        </div>

        {/* Technologies */}
        <div className="preview-skills__row">
          <span className="preview-skills__label">Technologies:</span>
          <div className="preview-skills__items">
            {technologies.length > 0 ? (
              <>
                {technologies.map((tech, index) => (
                  <React.Fragment key={`tech-${index}`}>
                    {editingItem?.type === 'technology' && editingItem?.index === index ? (
                      <input
                        ref={inputRef}
                        type="text"
                        className="preview-tag preview-tag--editing"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Type here..."
                        aria-label="Edit technology"
                      />
                    ) : (
                      tech !== '' && (
                        <span
                          className={`preview-tag ${selectedItem?.type === 'technology' && selectedItem?.index === index ? 'preview-tag--selected' : ''}`}
                          onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick('technology', index) }}
                        >
                          {tech}
                          {selectedItem?.type === 'technology' && selectedItem?.index === index && (
                            <button
                              className="preview-tag__remove"
                              onClick={(e) => { e.stopPropagation(); handleRemove() }}
                              aria-label="Remove technology"
                            >
                              −
                            </button>
                          )}
                        </span>
                      )
                    )}
                  </React.Fragment>
                ))}
                <button
                  type="button"
                  className="preview-tag preview-tag--add"
                  onClick={onAddTechnology}
                  aria-label="Add another technology"
                >
                  +
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="preview-tag preview-tag--add"
                  onClick={onAddTechnology}
                  aria-label="Add technology"
                >
                  +
                </button>
                <span className="preview-hint">Add your top skills</span>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default SkillsSection