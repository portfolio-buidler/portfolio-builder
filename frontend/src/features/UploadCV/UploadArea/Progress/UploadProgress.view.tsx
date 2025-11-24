import React from 'react'
import type { UploadProgressViewProps } from './UploadProgress.types'
import './UploadProgress.styles.scss'

export const UploadProgressView: React.FC<UploadProgressViewProps> = ({
  fileName,
  sizeText,
  timeLeftText,
  percent,
  onCancel,
}) => {
  return (
    <div className="upload-progress" role="status" aria-live="polite" aria-atomic="true">
      <div className="upload-progress__header">
        <div className="upload-progress__meta">
          <div className="upload-progress__name" title={fileName}>{fileName}</div>
        </div>
        <div className="upload-progress__right">
          <button
            type="button"
            className="upload-progress__cancel"
            onClick={onCancel}
            aria-label="Cancel upload"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              aria-hidden
              focusable="false"
            >
              <path
                d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.9 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.9a1 1 0 0 0 1.41-1.41L13.41 12l4.9-4.89a1 1 0 0 0-.01-1.4Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Second row with size/time left on the left and percent on the right */}
      <div className="upload-progress__sub">
        <div className="upload-progress__sub-left">
          <span>{sizeText}</span>
          <span>{timeLeftText}</span>
        </div>
        <span className="upload-progress__percent" aria-hidden>{percent}%</span>
      </div>

      <div className="upload-progress__bar" aria-label="Upload progress">
        <progress
          className="upload-progress__progress"
          value={percent}
          max={100}
          
          aria-label="Upload progress"
        />
      </div>
    </div>
  )
}

export default UploadProgressView
