import React from 'react'
import type { UploadAreaViewProps } from './UploadArea.types'
import { UploadProgress } from './Progress/UploadProgress'
import './UploadArea.styles.scss'
import PaperIcon from '../../../assets/icons/📜.svg'
import PartyIcon from '../../../assets/icons/🎉.svg'
import SadIcon from '../../../assets/icons/😔.svg'
import DinoIcon from '../../../assets/icons/🦖.svg'
import PeekIcon from '../../../assets/icons/🫣.svg'

export const UploadAreaView: React.FC<UploadAreaViewProps> = ({
  accept,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  onFileInputChange,
  isUploading,
  progress,
  onCancelUpload,
  status,
  errorMessage,
}) => {
  const pickErrorIconAndText = (rawMsg?: string) => {
    const raw = (rawMsg || '').trim()
    if (!raw) return { icon: '🦖', text: '' }
    const leading = raw.startsWith('🫣')
      ? '🫣'
      : raw.startsWith('😔')
      ? '😔'
      : raw.startsWith('🦖')
      ? '🦖'
      : null
    const text = leading ? raw.slice(leading.length).trim() : raw
    const icon = leading ?? '🦖'
    return { icon, text }
  }

  return (
    <div
      className="upload-area"
      data-dragover={dragOver}
      data-status={status}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      aria-label="Upload CV file by clicking or dragging and dropping. Allowed types: PDF, DOCX,. Maximum size 5MB."
      data-testid="upload-area"
    >
      <div className="upload-area__icon" aria-hidden="true">
        {isUploading && progress ? (
          <UploadProgress
            fileName={progress.fileName}
            fileSizeBytes={progress.fileSizeBytes}
            percent={progress.percent}
            uploadedBytes={progress.uploadedBytes}
            totalBytes={progress.totalBytes}
            etaSeconds={progress.etaSeconds}
            onCancel={onCancelUpload || (() => {})}
          />
        ) : (
          <>
            {/* Icon and Text */}
            {status === 'idle' && (
              <>
                <img src={PaperIcon} className="upload-area__emoji-img" alt="" aria-hidden />
                <div className="upload-area__text">
                  <p className="upload-area__headline">
                    Drop & Drag or <span className="upload-area__link">Choose File</span> To Upload
                  </p>
                  <p className="upload-area__subline">Accept PDF or DOCX up to 5MB</p>
                </div>
              </>
            )}

            {status === 'success' && (
              <>
                <img src={PartyIcon} className="upload-area__emoji-img" alt="" aria-hidden />
                <div className="upload-area__text">
                  <p className="upload-area__headline">Upload complete!</p>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                {(() => {
                  const picked = pickErrorIconAndText(errorMessage)
                  const leading = picked.icon
                  const src = leading === '🫣' ? PeekIcon : leading === '😔' ? SadIcon : DinoIcon
                  return <img src={src} className="upload-area__emoji-img" alt="" aria-hidden />
                })()}
                <div className="upload-area__text">
                  {(() => {
                    const { text: msgText } = pickErrorIconAndText(errorMessage)
                    if (msgText.includes('/')) {
                      const [line1, line2] = msgText.split('/')
                      return (
                        <>
                          <p className="upload-area__headline">{line1.trim()}</p>
                          <p className="upload-area__subline">{line2.trim()}</p>
                        </>
                      )
                    }
                    return <p className="upload-area__headline">{msgText}</p>
                  })()}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <input
        id="file-input"
        type="file"
        className="upload-area__input sr-only"
        accept={accept}
        onChange={onFileInputChange}
        aria-label="Upload CV file"
        aria-describedby="upload-instructions"
      />

      <div id="upload-instructions" className="sr-only">
        Upload your CV in PDF, DOCX, PNG or JPEG format. Maximum file size is 5MB. You can click to browse files or drag and drop a file here.
      </div>
    </div>
  )
}