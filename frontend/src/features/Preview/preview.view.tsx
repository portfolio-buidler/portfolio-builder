import React from 'react'
import type { PreviewViewProps } from './Preview.types'
import './Preview.styles.scss'

export const PreviewView: React.FC<PreviewViewProps> = ({ backgroundUrl, previewArea }) => {
  return (
    <div
      className="preview"
      style={{ ['--preview-bg' as any]: `url(${backgroundUrl})` }}
    >
      <div className="preview__container">
        <h1 className="preview__title">Portify.</h1>
        <div className="preview__body">
          {previewArea}
        </div>
      </div>
    </div>
  )
}