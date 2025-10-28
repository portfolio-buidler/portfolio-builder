// CommunicationSection.view.tsx
import React from 'react'
import type { CommunicationSectionViewProps } from './CommunicationSection.types'
import questionMarkIcon from '../../../../../assets/icons/PreviewPage/question-mark.svg'

/**
 * Communication Section View Component (Pure Presentation)
 * 
 * Renders the Communication section UI with no business logic.
 * All state and handlers are passed down from the container component.
 */
export const CommunicationSectionView: React.FC<CommunicationSectionViewProps> = ({
  title,
  complete,
  mobile,
  email,
  links,
  selectedItem,
  editingItem,
  editValue,
  inputRef,
  contentRef,
  onAddMobile,
  onAddEmail,
  onAddLink,
  onDoubleClick,
  onEditValueChange,
  onKeyDown,
  onRemove,
  isExpanded,
  onToggleExpanded
}) => {
  return (
    <section
      className="preview-section preview-section--communication"
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
        className="preview-section__content"
      >
        {/* Mobile Row */}
        <div className="preview-communication__row">
          <span className="preview-communication__label">Mobile:</span>
          <div className="preview-communication__items">
            {mobile !== null ? (
              <>
                {editingItem?.type === 'mobile' ? (
                  <input
                    ref={inputRef}
                    type="text"
                    className="preview-field preview-field--editing"
                    value={editValue}
                    onChange={(e) => onEditValueChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="+972 | Type phone number..."
                    aria-label="Edit mobile number"
                  />
                ) : (
                  mobile !== '' && (
                    <span
                      className={`preview-field ${
                        selectedItem?.type === 'mobile' ? 'preview-field--selected' : ''
                      }`}
                      onDoubleClick={(e) => { 
                        e.stopPropagation()
                        onDoubleClick('mobile')
                      }}
                    >
                      {mobile}
                      {selectedItem?.type === 'mobile' && (
                        <button
                          className="preview-field__remove"
                          onClick={(e) => { 
                            e.stopPropagation()
                            onRemove()
                          }}
                          aria-label="Remove mobile"
                        >
                          -
                        </button>
                      )}
                    </span>
                  )
                )}
              </>
            ) : (
              <button
                type="button"
                className="preview-tag preview-tag--add"
                onClick={onAddMobile}
                aria-label="Add mobile"
              >
                +972 | Add your phone number
              </button>
            )}
          </div>
        </div>

        {/* Email Row */}
        <div className="preview-communication__row">
          <span className="preview-communication__label">Email:</span>
          <div className="preview-communication__items">
            {email !== null ? (
              <>
                {editingItem?.type === 'email' ? (
                  <input
                    ref={inputRef}
                    type="text"
                    className="preview-field preview-field--editing"
                    value={editValue}
                    onChange={(e) => onEditValueChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Type email..."
                    aria-label="Edit email address"
                  />
                ) : (
                  email !== '' && (
                    <span
                      className={`preview-field ${
                        selectedItem?.type === 'email' ? 'preview-field--selected' : ''
                      }`}
                      onDoubleClick={(e) => { 
                        e.stopPropagation()
                        onDoubleClick('email')
                      }}
                    >
                      {email}
                      {selectedItem?.type === 'email' && (
                        <button
                          className="preview-field__remove"
                          onClick={(e) => { 
                            e.stopPropagation()
                            onRemove()
                          }}
                          aria-label="Remove email"
                        >
                          -
                        </button>
                      )}
                    </span>
                  )
                )}
              </>
            ) : (
              <button
                type="button"
                className="preview-tag preview-tag--add"
                onClick={onAddEmail}
                aria-label="Add email"
              >
                Add your email
              </button>
            )}
          </div>
        </div>

        {/* Links Row */}
        <div className="preview-communication__row">
          <span className="preview-communication__label">Links:</span>
          <div className="preview-communication__items">
            {/* Add button always at the start */}
            <button
              type="button"
              className="preview-tag preview-tag--add"
              onClick={onAddLink}
              aria-label={links.length > 0 ? "Add another link" : "Add social link"}
            >
              +
            </button>
            
            {/* Show hint if no links yet */}
            {links.length === 0 && (
              <span className="preview-hint">Add your social media</span>
            )}
            
            {/* Render existing links after the add button */}
            {links.map((link, index) => (
              <React.Fragment key={`link-${index}`}>
                {editingItem?.type === 'link' && editingItem?.index === index ? (
                  <input
                    ref={inputRef}
                    type="text"
                    className="preview-tag preview-tag--editing"
                    value={editValue}
                    onChange={(e) => onEditValueChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Type link..."
                    aria-label="Edit link"
                  />
                ) : (
                  link !== '' && (
                    <span
                      className={`preview-tag ${
                        selectedItem?.type === 'link' && selectedItem?.index === index 
                          ? 'preview-tag--selected' 
                          : ''
                      }`}
                      onDoubleClick={(e) => { 
                        e.stopPropagation()
                        onDoubleClick('link', index)
                      }}
                    >
                      {link}
                      {selectedItem?.type === 'link' && selectedItem?.index === index && (
                        <button
                          className="preview-tag__remove"
                          onClick={(e) => { 
                            e.stopPropagation()
                            onRemove()
                          }}
                          aria-label="Remove link"
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
        aria-expanded={isExpanded}
      />
    </section>
  )
}

export default CommunicationSectionView