import React from 'react'
import type { UploadCVViewProps } from './UploadCV.types'
import './UploadCV.styles.scss'
import UploadArea from './UplaodArea/UploadArea'
import RefreshIcon from '../../assets/icons/refresh.png'

export const UploadCVView: React.FC<UploadCVViewProps> = ({
  backgroundUrl,
  ready,
  isUploading,
  onUpload,
  onFileSelect,
  onDropFile,
  progress,
  status,
  errorMessage,
  onStatusChange,
  onRetry,
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isUploading) {
      e.preventDefault()
      return
    }
    if (status === 'error') {
      onRetry()
      return
    }
    if (ready) {
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
          Portify.
        </h1>

        <div className="upload-cv__auth-buttons">
          <button type="button" className="upload-cv__auth-btn upload-cv__auth-btn--login">
            Log in
          </button>
          <button type="button" className="upload-cv__auth-btn upload-cv__auth-btn--register">
            Registration
          </button>
        </div>

        <div className="upload-cv__body">
          <h2 className="upload-cv__upload-title">Upload your CV</h2>
          <UploadArea
            onFileSelect={onFileSelect}
            onDropFile={onDropFile}
            isUploading={isUploading}
            progress={progress}
            status={status}
            errorMessage={errorMessage}
            onStatusChange={onStatusChange}
          />

          <button
            type="button"
            className={
              `upload-cv__cta` +
              (isUploading ? ' upload-cv__cta--loading' : '') +
              (status === 'error' ? ' upload-cv__cta--error' : '')
            }
            onClick={handleClick}
            aria-disabled={isUploading || undefined}
            disabled={isUploading || undefined}
            aria-busy={isUploading || undefined}
          >
            {status === 'error' ? (
              <>
                <span className="upload-cv__cta-label">Try again</span>
                <img src={RefreshIcon} alt="" aria-hidden className="upload-cv__cta-icon-img" />
              </>
            ) : (
              <>
                <span className="upload-cv__cta-label">Next</span>
                {!isUploading && (
                  <span className="upload-cv__cta-icon" aria-hidden="true">›</span>
                )}
              </>
            )}
          </button>
        </div>


          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {isUploading ? 'Upload in progress' : 'Idle'}
          </div>
        </div>


    </div>
  )
}