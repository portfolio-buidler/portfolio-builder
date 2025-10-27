// SkillsSection.view.tsx
import React from 'react'
import type { SkillsSectionViewProps } from './SkillsSection.types'
import questionMarkIcon from '../../../../../assets/icons/PreviewPage/question-mark.svg'

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
  onAddLanguage,
  onAddTechnology,
  onDoubleClick,
  onEditValueChange,
  onKeyDown,
  onRemove,
  isExpanded,
  onToggleExpanded
}) => {
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

      <div className="preview-section__content">
        {/* Languages Row */}
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

        {/* Technologies Row */}
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

      <button
        type="button"
        className="preview-section__toggle"
        onClick={(e) => { e.stopPropagation(); if (onToggleExpanded) onToggleExpanded() }}
        aria-label={isExpanded ? `Collapse ${title.toLowerCase()}` : `Expand ${title.toLowerCase()}`}
        aria-expanded={isExpanded}
      />
    </section>
  )
}

export default SkillsSectionView