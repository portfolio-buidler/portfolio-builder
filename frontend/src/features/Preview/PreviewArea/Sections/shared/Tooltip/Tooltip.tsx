// Tooltip.tsx
import React from 'react'
import './Tooltip.styles.scss'

export interface TooltipProps {
  /** The content to display in the tooltip */
  content: React.ReactNode
  /** The position of the tooltip relative to the trigger */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** The children element that triggers the tooltip */
  children: React.ReactNode
  /** Additional class name for the tooltip */
  className?: string
}

/**
 * Dark speech bubble tooltip component.
 * Displays a tooltip on hover with an arrow pointing to the trigger element.
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'right',
  children,
  className = '',
}) => {
  const [isVisible, setIsVisible] = React.useState(false)
  const tooltipRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => setIsVisible(true)
  const handleMouseLeave = () => setIsVisible(false)

  return (
    <div
      className={`tooltip-wrapper ${className}`}
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`tooltip tooltip--${position}`}
          role="tooltip"
        >
          <div className="tooltip__content">{content}</div>
          <div className="tooltip__arrow" />
        </div>
      )}
    </div>
  )
}

export default Tooltip

