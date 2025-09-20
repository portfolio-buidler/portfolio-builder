import React from 'react'
import type { UploadCVViewProps } from './UploadCV.types'
import './UploadCV.styles.scss'
import UploadArea from './UploadArea'

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
            className="upload-cv__cta"
            onClick={handleClick}
            aria-disabled={!ready || isUploading}
            disabled={!ready || isUploading}
          >
            <span className="upload-cv__cta-label">Let's Do It!</span>
            <span className="upload-cv__cta-icon" aria-hidden>
              →
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
