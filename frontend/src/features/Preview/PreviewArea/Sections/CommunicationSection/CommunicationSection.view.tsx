// CommunicationSection.view.tsx  (patch)
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
}) => {
  const [selectedItem, setSelectedItem] = React.useState<{ type: 'mobile' | 'email' | 'link', index?: number } | null>(null)

  const handleDoubleClick = (type: 'mobile' | 'email' | 'link', index?: number) => {
    setSelectedItem({ type, index })
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
    const handleClickOutside = () => setSelectedItem(null)
    if (selectedItem) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [selectedItem])

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
            {mobile ? (
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
            ) : (
              <>
                <button
                  type="button"
                  className="preview-tag preview-tag--add"
                  onClick={onAddMobile}
                  aria-label="Add mobile"
                >
                  +972 | Add your phone number
                </button>
              </>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="preview-communication__row">
          <span className="preview-communication__label">Email:</span>
          <div className="preview-communication__items">
            {email ? (
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
            ) : (
              <>
                <button
                  type="button"
                  className="preview-tag preview-tag--add"
                  onClick={onAddEmail}
                  aria-label="Add email"
                >
                  Add your email
                </button>
              </>
            )}
          </div>
        </div>

        {/* Links */}
        <div className="preview-communication__row">
          <span className="preview-communication__label">Links:</span>
          <div className="preview-communication__items">
            {links.map((link, index) => (
              <span
                key={`${link}-${index}`}
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