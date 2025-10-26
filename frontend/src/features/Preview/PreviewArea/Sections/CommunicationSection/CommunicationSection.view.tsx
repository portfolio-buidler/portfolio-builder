// CommunicationSection.view.tsx
import React from 'react'
import type { CommunicationSectionProps } from './CommunicationSection.types'

export const CommunicationSection: React.FC<CommunicationSectionProps> = ({
  title,
  complete,
  mobile,
  email,
  links,
  onAddMobile,
  onAddEmail,
  onAddLink,
  onRemoveMobile,
  onRemoveEmail,
  onRemoveLink,
  onChangeMobile,
  onChangeEmail,
  onChangeLink,
}) => {
  const [selectedItem, setSelectedItem] = React.useState<{ type: 'mobile' | 'email' | 'link', index?: number } | null>(null)
  const [editingItem, setEditingItem] = React.useState<{ type: 'mobile' | 'email' | 'link', index?: number } | null>(null)
  const [editValue, setEditValue] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Auto-edit when a new empty field is added
  React.useEffect(() => {
    if (mobile === '') {
      setEditingItem({ type: 'mobile' })
      setEditValue('')
    } else if (email === '') {
      setEditingItem({ type: 'email' })
      setEditValue('')
    } else {
      const lastLinkIndex = links.length - 1
      if (lastLinkIndex >= 0 && links[lastLinkIndex] === '') {
        setEditingItem({ type: 'link', index: lastLinkIndex })
        setEditValue('')
      }
    }
  }, [mobile, email, links.length])

  // Focus input when editing starts
  React.useEffect(() => {
    if (editingItem && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingItem])

  const handleDoubleClick = (type: 'mobile' | 'email' | 'link', index?: number) => {
    // Only allow double-click on saved (non-empty) items
    let value = ''
    if (type === 'mobile' && mobile) value = mobile
    else if (type === 'email' && email) value = email
    else if (type === 'link' && index !== undefined) value = links[index]
    
    if (value.trim() !== '') {
      setSelectedItem({ type, index })
    }
  }

  const handleSave = () => {
    if (editingItem && editValue.trim()) {
      if (editingItem.type === 'mobile') {
        onChangeMobile(editValue.trim())
      } else if (editingItem.type === 'email') {
        onChangeEmail(editValue.trim())
      } else if (editingItem.type === 'link' && editingItem.index !== undefined) {
        onChangeLink(editingItem.index, editValue.trim())
      }
    } else if (editingItem && editValue.trim() === '') {
      // Remove empty field if user didn't type anything
      if (editingItem.type === 'mobile') {
        onRemoveMobile()
      } else if (editingItem.type === 'email') {
        onRemoveEmail()
      } else if (editingItem.type === 'link' && editingItem.index !== undefined) {
        onRemoveLink(editingItem.index)
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
      // Remove empty field on escape
      if (editingItem) {
        if (editingItem.type === 'mobile') {
          onRemoveMobile()
        } else if (editingItem.type === 'email') {
          onRemoveEmail()
        } else if (editingItem.type === 'link' && editingItem.index !== undefined) {
          onRemoveLink(editingItem.index)
        }
      }
      setEditingItem(null)
      setEditValue('')
    }
  }

  const handleRemove = () => {
    if (selectedItem) {
      if (selectedItem.type === 'mobile') {
        onRemoveMobile()
      } else if (selectedItem.type === 'email') {
        onRemoveEmail()
      } else if (selectedItem.type === 'link' && selectedItem.index !== undefined) {
        onRemoveLink(selectedItem.index)
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
      className="preview-section preview-section--communication"
      data-complete={complete}
    >
      <h3 className="preview-section__title">{title}</h3>

      <div className="preview-section__content">

        {/* Mobile */}
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
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="+972 | Type phone number..."
                    aria-label="Edit mobile number"
                  />
                ) : (
                  mobile !== '' && (
                    <span
                      className={`preview-field ${selectedItem?.type === 'mobile' ? 'preview-field--selected' : ''}`}
                      onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick('mobile') }}
                    >
                      {mobile}
                      {selectedItem?.type === 'mobile' && (
                        <button
                          className="preview-field__remove"
                          onClick={(e) => { e.stopPropagation(); handleRemove() }}
                          aria-label="Remove mobile"
                        >
                          −
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

        {/* Email */}
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
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Type email..."
                    aria-label="Edit email address"
                  />
                ) : (
                  email !== '' && (
                    <span
                      className={`preview-field ${selectedItem?.type === 'email' ? 'preview-field--selected' : ''}`}
                      onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick('email') }}
                    >
                      {email}
                      {selectedItem?.type === 'email' && (
                        <button
                          className="preview-field__remove"
                          onClick={(e) => { e.stopPropagation(); handleRemove() }}
                          aria-label="Remove email"
                        >
                          −
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

        {/* Links */}
        <div className="preview-communication__row">
          <span className="preview-communication__label">Links:</span>
          <div className="preview-communication__items">
            {links.map((link, index) => (
              <React.Fragment key={`link-${index}`}>
                {editingItem?.type === 'link' && editingItem?.index === index ? (
                  <input
                    ref={inputRef}
                    type="text"
                    className="preview-tag preview-tag--editing"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Type link..."
                    aria-label="Edit link"
                  />
                ) : (
                  link !== '' && (
                    <span
                      className={`preview-tag ${selectedItem?.type === 'link' && selectedItem?.index === index ? 'preview-tag--selected' : ''}`}
                      onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick('link', index) }}
                    >
                      {link}
                      {selectedItem?.type === 'link' && selectedItem?.index === index && (
                        <button
                          className="preview-tag__remove"
                          onClick={(e) => { e.stopPropagation(); handleRemove() }}
                          aria-label="Remove link"
                        >
                          −
                        </button>
                      )}
                    </span>
                  )
                )}
              </React.Fragment>
            ))}

            {links.length === 0 ? (
              <>
                <button
                  type="button"
                  className="preview-tag preview-tag--add"
                  onClick={onAddLink}
                  aria-label="Add social link"
                >
                  +
                </button>
                <span className="preview-hint">Add your social media</span>
              </>
            ) : (
              <button
                type="button"
                className="preview-tag preview-tag--add"
                onClick={onAddLink}
                aria-label="Add another link"
              >
                +
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default CommunicationSection