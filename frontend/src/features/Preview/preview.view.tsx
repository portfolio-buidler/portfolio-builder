// preview.view.tsx
import React, { useEffect, useRef } from 'react'
import type { PreviewViewProps } from './Preview.types'
import './Preview.styles.scss'

export const PreviewView: React.FC<PreviewViewProps> = ({ backgroundUrl, previewArea }) => {
  const bodyRef = useRef<HTMLDivElement|null>(null)
  const indicatorRef = useRef<HTMLDivElement|null>(null)

  useEffect(() => {
    const container = bodyRef.current
    const indicator = indicatorRef.current
    if (!container || !indicator) return

    // cache DOM targets
    const about = container.querySelector('[data-section="about"]') as HTMLElement | null
    const projects = container.querySelector('[data-section="projects"]') as HTMLElement | null
    if (!about || !projects) return

    // recompute bounds safely
    let start = 0, end = 1, travelMax = 1, indicatorH = 0
    const computeBounds = () => {
      const ch = container.clientHeight
      indicatorH = indicator.offsetHeight || 0
      start = about.offsetTop
      // last scrollTop at which the bottom of projects aligns with the bottom of the viewport
      end = projects.offsetTop + projects.offsetHeight - ch
      travelMax = Math.max(0, ch - indicatorH) // how far the line can move
    }

    const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const st = container.scrollTop
        const progress = clamp((st - start) / Math.max(1, end - start), 0, 1)
        indicator.style.transform = `translateY(${progress * travelMax}px)`
        ticking = false
      })
    }

    const onResize = () => { computeBounds(); onScroll() }

    computeBounds()
    onScroll()

    // performant listeners
    container.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)

    // layout changes inside content? observe and recompute
    const mo = new MutationObserver(() => { computeBounds(); onScroll() })
    mo.observe(container, { childList: true, subtree: true })

    return () => {
      container.removeEventListener('scroll', onScroll as EventListener)
      window.removeEventListener('resize', onResize)
      mo.disconnect()
    }
  }, [])

  return (
    <div className="preview">
      {backgroundUrl && (
        <img className="preview__bg-img" src={backgroundUrl} alt="" aria-hidden />
      )}
      <div className="preview__container">
        <h1 className="preview__title">Portify.</h1>
        <div className="preview__body" ref={bodyRef}>
          {/* The moving line */}
          <div className="preview__scroll-indicator" aria-hidden ref={indicatorRef} />
          {previewArea}
        </div>
      </div>
    </div>
  )
}