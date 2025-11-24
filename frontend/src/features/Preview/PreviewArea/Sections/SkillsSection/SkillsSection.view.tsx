// SkillsSection.view.tsx
import React from 'react'
import type { SkillsSectionViewProps } from './SkillsSection.types'
import questionMarkIcon from '../../../../../assets/icons/PreviewPage/question-mark.svg'
import './SkillsSection.styles.scss'

/**
 * Skills Section View Component (Pure Presentation)
 * 
 * Renders the Skills section UI with no business logic.
 * All state and handlers are passed down from the container component.
 */
export const SkillsSectionView: React.FC<SkillsSectionViewProps> = ({ 
  title, 
  complete,
  languages,
  technologies,
  selectedItem,
  editingItem,
  editValue,
  inputRef,
  contentRef,
  onAddLanguage,
  onAddTechnology,
  onDoubleClick,
  onEditValueChange,
  onKeyDown,
  onRemove,
  isExpanded,
  onToggleExpanded
}) => {
  const uid = React.useId()
  const contentId = `skills-content-${uid}`
  const toggleId = `skills-toggle-${uid}`

  return (
    <section
      className="preview-section preview-section--skills"
      data-complete={complete}
      data-expanded={isExpanded}
    >
      <div className="preview-section__title-container">
        <h3 className="preview-section__title">{title}</h3>
        <img
          src={questionMarkIcon}
          alt="Help"
          className="preview-section__help-icon"
        />
      </div>

      <div 
        ref={contentRef}
        id={contentId}
        role="region"
        aria-labelledby={toggleId}
        className="preview-section__content"
      >
        {/* Languages Row */}
        <div className="preview-skills__row">
          <span className="preview-skills__label">Languages:</span>
          <div className="preview-skills__items">
            {/* Add button always at the start */}
            <button
              type="button"
              className="preview-tag preview-tag--add"
              onClick={onAddLanguage}
              aria-label={languages.length > 0 ? "Add another language" : "Add language"}
            >
              +
            </button>
            
            {/* Render existing tags after the add button */}
            {languages.map((lang, index) => (
              <React.Fragment key={`lang-${index}`}>
                {editingItem?.type === 'language' && editingItem?.index === index ? (
                  <input
                    ref={inputRef}
                    type="text"
                    className="preview-tag preview-tag--editing"
                    value={editValue}
                    onChange={(e) => onEditValueChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Type here..."
                    aria-label="Edit language"
                  />
                ) : (
                  lang !== '' && (
                    <span
                      className={`preview-tag ${
                        selectedItem?.type === 'language' && selectedItem?.index === index 
                          ? 'preview-tag--selected' 
                          : ''
                      }`}
                      onDoubleClick={(e) => { 
                        e.stopPropagation()
                        onDoubleClick('language', index)
                      }}
                    >
                      {lang}
                      {selectedItem?.type === 'language' && selectedItem?.index === index && (
                        <button
                          className="preview-tag__remove"
                          onClick={(e) => { 
                            e.stopPropagation()
                            onRemove()
                          }}
                          aria-label="Remove language"
                        >
                          -
                        </button>
                      )}
                    </span>
                  )
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Technologies Row */}
        <div className="preview-skills__row">
          <span className="preview-skills__label">Technologies:</span>
          <div className="preview-skills__items">
            {/* Add button always at the start */}
            <button
              type="button"
              className="preview-tag preview-tag--add"
              onClick={onAddTechnology}
              aria-label={technologies.length > 0 ? "Add another technology" : "Add technology"}
            >
              +
            </button>
            
            {/* Show hint if no technologies yet */}
            {technologies.length === 0 && (
              <span className="preview-hint">Add your top skills</span>
            )}
            
            {/* Render existing tags after the add button */}
            {technologies.map((tech, index) => (
              <React.Fragment key={`tech-${index}`}>
                {editingItem?.type === 'technology' && editingItem?.index === index ? (
                  <input
                    ref={inputRef}
                    type="text"
                    className="preview-tag preview-tag--editing"
                    value={editValue}
                    onChange={(e) => onEditValueChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Type here..."
                    aria-label="Edit technology"
                  />
                ) : (
                  tech !== '' && (
                    <span
                      className={`preview-tag ${
                        selectedItem?.type === 'technology' && selectedItem?.index === index 
                          ? 'preview-tag--selected' 
                          : ''
                      }`}
                      onDoubleClick={(e) => { 
                        e.stopPropagation()
                        onDoubleClick('technology', index)
                      }}
                    >
                      {tech}
                      {selectedItem?.type === 'technology' && selectedItem?.index === index && (
                        <button
                          className="preview-tag__remove"
                          onClick={(e) => { 
                            e.stopPropagation()
                            onRemove()
                          }}
                          aria-label="Remove technology"
                        >
                          -
                        </button>
                      )}
                    </span>
                  )
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="preview-section__toggle"
        onClick={(e) => { e.stopPropagation(); if (onToggleExpanded) onToggleExpanded() }}
        aria-label={isExpanded ? `Collapse ${title.toLowerCase()}` : `Expand ${title.toLowerCase()}`}
        id={toggleId}
        aria-controls={contentId}
        {...(typeof isExpanded === 'boolean' ? { 'aria-expanded': isExpanded } : {})}
      />
    </section>
  )
}

export default SkillsSectionView