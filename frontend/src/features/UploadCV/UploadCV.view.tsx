import React from 'react'
import type { UploadCVViewProps } from './UploadCV.types'
import './UploadCV.styles.scss'
import UploadArea from './UplaodArea/UploadArea'

export const UploadCVView: React.FC<UploadCVViewProps> = ({
  backgroundUrl,
  ready,
  isUploading,
  onUpload,
  onFileSelect,
  onDropFile,
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (ready && !isUploading) {
      onUpload()
    } else {
      e.preventDefault()
    }
  }

  return (
    <div
      className="upload-cv"
      style={{ ['--uploadcv-bg' as any]: `url(${backgroundUrl})` }}
      data-ready={ready}
    >
      <div className="upload-cv__container">
        <h1 className="upload-cv__title">
          Portfolio <span className="upload-cv__title-highlight">Builder</span>
        </h1>

        <div className="upload-cv__body">
          <UploadArea onFileSelect={onFileSelect} onDropFile={onDropFile} />

          <button
            type="button"
            className={`upload-cv__cta${isUploading ? ' upload-cv__cta--loading' : ''}`}
            onClick={handleClick}
            aria-disabled={!ready || isUploading}
            disabled={!ready || isUploading}
            aria-busy={isUploading || undefined}
          >
            {isUploading && <span className="upload-cv__cta-spinner" aria-hidden="true" />}
            <span className="upload-cv__cta-label">{isUploading ? 'Uploading…' : "Let's Do It!"}</span>
            {!isUploading && (
              <span className="upload-cv__cta-icon" aria-hidden>
                →
              </span>
            )}
          </button>

          {/* Screen reader status announcement */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {isUploading ? 'Upload in progress' : 'Idle'}
          </div>
        </div>
      </div>
      {/* Fixed Contact Us button at bottom-left, remains visible on scroll */}
      <button
        type="button"
        className="contact-us-button"
        aria-label="Contact Us"
      >
        Contact Us
      </button>
    </div>
  )
}
