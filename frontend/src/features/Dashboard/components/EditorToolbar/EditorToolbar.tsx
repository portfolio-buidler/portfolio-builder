// EditorToolbar.tsx
import React from 'react'
import type { EditorToolbarProps } from '../../Dashboard.types'
import './EditorToolbar.styles.scss'

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  mode,
  onModeChange,
  onUndo,
  onRedo,
  undoAvailable,
  redoAvailable,
  onColorClick,
  onTypographyClick,
}) => {
  return (
    <div className="editor-toolbar">
      {/* History Controls */}
      <div className="editor-toolbar__history">
        <button
          type="button"
          className="editor-toolbar__btn editor-toolbar__btn--undo"
          onClick={onUndo}
          disabled={!undoAvailable}
          aria-label="Undo"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 14L5 10M5 10L9 6M5 10H16C17.0609 10 18.0783 10.4214 18.8284 11.1716C19.5786 11.9217 20 12.9391 20 14C20 15.0609 19.5786 16.0783 18.8284 16.8284C18.0783 17.5786 17.0609 18 16 18H15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          className="editor-toolbar__btn editor-toolbar__btn--redo"
          onClick={onRedo}
          disabled={!redoAvailable}
          aria-label="Redo"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 14L19 10M19 10L15 6M19 10H8C6.93913 10 5.92172 10.4214 5.17157 11.1716C4.42143 11.9217 4 12.9391 4 14C4 15.0609 4.42143 16.0783 5.17157 16.8284C5.92172 17.5786 6.93913 18 8 18H9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Customization Options */}
      <div className="editor-toolbar__options">
        <button
          type="button"
          className="editor-toolbar__option"
          onClick={onColorClick}
        >
          Color
        </button>
        <button
          type="button"
          className="editor-toolbar__option"
          onClick={onTypographyClick}
        >
          Typographic
        </button>
      </div>

      {/* Mode Toggle */}
      <div className="editor-toolbar__mode-toggle">
        <button
          type="button"
          className={`editor-toolbar__mode-btn ${
            mode === 'edit' ? 'editor-toolbar__mode-btn--active' : ''
          }`}
          onClick={() => onModeChange('edit')}
        >
          Edit
        </button>
        <button
          type="button"
          className={`editor-toolbar__mode-btn ${
            mode === 'display' ? 'editor-toolbar__mode-btn--active' : ''
          }`}
          onClick={() => onModeChange('display')}
        >
          Display
        </button>
      </div>
    </div>
  )
}

export default EditorToolbar

