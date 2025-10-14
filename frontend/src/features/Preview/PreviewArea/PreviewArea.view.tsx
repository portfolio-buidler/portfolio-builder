import React from 'react';
import './PreviewArea.styles.scss';
import type { PreviewAreaProps } from './PreviewArea.types';

export const PreviewAreaView: React.FC<PreviewAreaProps> = () => {
  return (
    <div className="preview-area">
      <div className="preview-area__frame preview-area__frame--small">
        <div className="preview-area__rect38" />
        <div className="preview-area__chevron">
          <svg
            width="30"
            height="30"
            viewBox="0 0 30 30"
            style={{ transform: 'rotate(180deg)' }}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g>
              <rect width="30" height="30" fill="none" />
              <path
                d="M18.75 7.5L11.25 15L18.75 22.5"
                stroke="#354052"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </svg>
        </div>
      </div>
      <div className="preview-area__frame preview-area__frame--large">
        <div className="preview-area__inner preview-area__inner--row">
          <h2 className="preview-area__row-title">Preview</h2>
          <p className="preview-area__row-message">
            Please complete all required fields before continuing (not included work experience). You won’t be able to move to the next step until everything is filled out.
          </p>
        </div>
        <div className="preview-area__inner preview-area__inner--block-a" />
        <div className="preview-area__inner preview-area__inner--block-b" />
        <div className="preview-area__inner preview-area__inner--block-c" />
        <div className="preview-area__inner preview-area__inner--block-d" />
        <div className="preview-area__inner preview-area__inner--block-e" />
      </div>
    </div>
  );
};
