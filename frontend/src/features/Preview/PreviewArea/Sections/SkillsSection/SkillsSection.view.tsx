// SkillsSection.view.tsx  (patch)
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
  onRemoveTechnology
}) => {
  const [selectedItem, setSelectedItem] = React.useState<{ type: 'language' | 'technology', index: number } | null>(null)

  const handleDoubleClick = (type: 'language' | 'technology', index: number) => {
    setSelectedItem({ type, index })
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
    const handleClickOutside = () => setSelectedItem(null)
    if (selectedItem) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [selectedItem])

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
                  <span
                    key={`${lang}-${index}`}
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
                  <span
                    key={`${tech}-${index}`}
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