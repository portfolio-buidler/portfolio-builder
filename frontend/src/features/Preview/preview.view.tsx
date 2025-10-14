import React from 'react'
import type { PreviewViewProps } from './preview.types'
import './Preview.styles.scss'

export const PreviewView: React.FC<PreviewViewProps> = ({
  onBack
}) => {
  return (
    <div className="preview">
      <div className="preview__container">
        <header className="preview__header">
          <button 
            className="preview__back-button" 
            onClick={onBack}
          >
            חזרה להעלאה
          </button>
          <h1 className="preview__title">תצוגה מקדימה</h1>
        </header>
        
        <main className="preview__content">
          <p>כאן יופיע התוכן שהועלה - פשוט ומינימלי</p>
        </main>
      </div>
    </div>
  )
}