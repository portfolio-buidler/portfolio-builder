import React from 'react';
import './PreviewArea.styles.scss';
import type { PreviewAreaViewProps, PreviewSection } from './PreviewArea.types';

export const PreviewAreaView: React.FC<PreviewAreaViewProps> = ({
 sections,
  onBack,
  onNext,
  isNextEnabled,
}) => {
  return (
    <div className="preview-area">
      {/* Header with back arrow and instructional text */}
      <div className="preview-area__header">
        <button
          type="button"
          className="preview-area__back"
          onClick={onBack}
          aria-label="Go back"
        >
          {/* Using a simple left chevron character for the back arrow. Replace with an SVG if required. */}
          ‹
        </button>
        <div className="preview-area__intro">
          <h2 className="preview-area__title">Preview</h2>
          <p className="preview-area__subtitle">
            Please complete all required fields before continuing (not included work experience).<br />
            You won't be able to move to the next step until everything is filled out.
          </p>
        </div>
      </div>

      {/* Scrollable container of preview sections */}
      <div className="preview-area__sections">
        {sections.map((section: PreviewSection) => (
          <section
            key={section.id}
            className="preview-section"
            data-complete={section.completed ?? true}
          >
            <h3 className="preview-section__title">{section.title}</h3>
            <div className="preview-section__content">{section.content}</div>
          </section>
        ))}
      </div>

      {/* Navigation controls at the bottom */}
      <div className="preview-area__navigation">
        <button
          type="button"
          className="preview-area__nav preview-area__nav--back"
          onClick={onBack}
          aria-label="Back"
        >
          ‹
        </button>
        <button
          type="button"
          className="preview-area__nav preview-area__nav--next"
          onClick={isNextEnabled ? onNext : undefined}
          disabled={!isNextEnabled}
          aria-disabled={!isNextEnabled || undefined}
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default PreviewAreaView