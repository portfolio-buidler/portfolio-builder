import React from 'react'
import type { PreviewViewProps } from './Preview.types'
import './Preview.styles.scss'

export const PreviewView: React.FC<PreviewViewProps> = ({ backgroundUrl }) => {
  return (
    <div
      className="preview"
      style={{ ['--preview-bg' as any]: `url(${backgroundUrl})` }}
    >
      <h1 className="preview__title">Portify.</h1>
    </div>
  )
}