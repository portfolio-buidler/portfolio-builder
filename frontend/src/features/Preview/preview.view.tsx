import React from 'react'
import type { PreviewViewProps } from './Preview.types'
import './Preview.styles.scss'

export const PreviewView: React.FC<PreviewViewProps> = ({ backgroundUrl, previewArea }) => {
  const bodyRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const bodyElement = bodyRef.current
    if (!bodyElement) return

    const handleScroll = () => {
      const scrollTop = bodyElement.scrollTop
      const scrollHeight = bodyElement.scrollHeight
      const clientHeight = bodyElement.clientHeight
      
      // Calculate scrollable area
      const scrollableHeight = scrollHeight - clientHeight
      
      if (scrollableHeight <= 0) {
        // No scrolling needed, center the line
        bodyElement.style.setProperty('--scroll-indicator-top', '50%')
        bodyElement.style.setProperty('--scroll-indicator-transform', 'translateY(-50%)')
        return
      }
      
      // Calculate the scroll progress (0 to 1)
      const scrollProgress = scrollTop / scrollableHeight
      
      // Line 4 height is 296px, container height minus line height gives us travel distance
      const lineHeight = 296
      const containerHeight = clientHeight
      const maxTravel = containerHeight - lineHeight
      
      // Calculate the top position (line travels from 0 to maxTravel)
      const topPosition = scrollProgress * maxTravel
      
      bodyElement.style.setProperty('--scroll-indicator-top', `${topPosition}px`)
      bodyElement.style.setProperty('--scroll-indicator-transform', 'translateY(0)')
    }

    // Initial position
    handleScroll()

    bodyElement.addEventListener('scroll', handleScroll)
    return () => bodyElement.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      className="preview"
      style={{ ['--preview-bg' as any]: `url(${backgroundUrl})` }}
    >
      <div className="preview__container">
        <h1 className="preview__title">Portify.</h1>
        <div className="preview__body" ref={bodyRef}>
          {previewArea}
        </div>
      </div>
    </div>
  )
}