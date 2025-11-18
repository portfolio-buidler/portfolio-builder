import React from 'react'
import type { UploadCVViewProps } from './UploadCV.types'
import './UploadCV.styles.scss'
import UploadArea from './UploadArea/UploadArea'
import RefreshIcon from '../../assets/icons/refresh.png'

export const UploadCVView: React.FC<UploadCVViewProps> = ({
  backgroundUrl,
  ready,
  isUploading,
  onUpload,
  onNext,
  onFileSelect,
  onDropFile,
  progress,
  status,
  errorMessage,
  onStatusChange,
  onRetry,
  user,
  onLogin,
  onRegister,
  onLogout,
}) => {
  /**
   * Handle Next/Try Again button click
   * Different behavior based on current status:
   * - error: Retry file selection
   * - success: Proceed to next step (auth check + navigation)
   * - idle + ready: Start upload
   * - uploading: Do nothing
   */
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent action during upload
    if (isUploading) {
      e.preventDefault()
      return
    }

    // Error state: Retry file selection
    if (status === 'error') {
      onRetry()
      return
    }

    // Success state: Proceed to next step (auth check happens in parent)
    if (status === 'success') {
      onNext()
      return
    }

    // Idle state with file: Start upload
    if (ready && status === 'idle') {
      onUpload()
      return
    }

    // Default: Do nothing
    e.preventDefault()
  }

  return (
    <div
      className="upload-cv"
      style={{ ['--uploadcv-bg' as any]: `url(${backgroundUrl})` }}
      data-ready={ready}
    >
      <div className="upload-cv__container">
        <div className="upload-cv__header">
          <h1 className="upload-cv__title">Portify.</h1>

          {/* Auth section */}
          <div className="upload-cv__auth-section">
            {user ? (
              <div className="upload-cv__user-info">
                <span className="upload-cv__username">{user.full_name}</span>
                {onLogout && (
                  <button
                    type="button"
                    className="upload-cv__logout-btn"
                    onClick={onLogout}
                    aria-label="Logout"
                  >
                    Logout
                  </button>
                )}
              </div>
            ) : (
              <div className="upload-cv__auth-buttons">
                <button 
                  type="button" 
                  className="upload-cv__auth-btn upload-cv__auth-btn--login"
                  onClick={onLogin}
                >
                  Log in
                </button>
                <button 
                  type="button" 
                  className="upload-cv__auth-btn upload-cv__auth-btn--register"
                  onClick={onRegister}
                >
                  Registration
                </button>
              </div>
            )}
          </div>
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
            aria-disabled={isUploading || (!ready && status === 'idle') || undefined}
            disabled={isUploading || (!ready && status === 'idle') || undefined}
            aria-busy={isUploading || undefined}
          >
            {status === 'error' ? (
              <>
                <span className="upload-cv__cta-label">Try again</span>
                <img src={RefreshIcon} alt="" aria-hidden className="upload-cv__cta-icon-img" />
              </>
            ) : (
              <>
                {isUploading && (
                  <span className="upload-cv__cta-spinner" aria-hidden="true" />
                )}
                <span className="upload-cv__cta-label">Next</span>
                {!isUploading && (
                  <span className="upload-cv__cta-icon" aria-hidden="true">›</span>
                )}
              </>
            )}
          </button>
        </div>

        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {isUploading ? 'Upload in progress' : status === 'success' ? 'Upload complete' : 'Idle'}
        </div>
      </div>
    </div>
  )
}