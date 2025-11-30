// preview.view.tsx
import React, { useEffect, useRef } from 'react'
import type { PreviewViewProps } from './Preview.types'
import './Preview.styles.scss'

export const PreviewView: React.FC<PreviewViewProps> = ({ backgroundUrl, previewArea, user, onLogout }) => {
  const bodyRef = useRef<HTMLDivElement|null>(null)
  const indicatorRef = useRef<HTMLDivElement|null>(null)

  // Debug: Log user prop
  React.useEffect(() => {
    console.log('[PreviewView] Rendered with user:', user)
    console.log('[PreviewView] Auth section should be visible')
  }, [user])

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

  // Render auth section - always visible, shows loading state if user not loaded yet
  return (
    <>
      {/* Auth section - fixed position top right (matches UploadCV exactly) */}
      <div 
        className="preview__auth-section" 
        id="preview-auth-section"
      >
        {user ? (
          <div className="preview__user-info">
            <span className="preview__username">{user.full_name || user.email}</span>
            <button
              type="button"
              className="preview__logout-btn"
              onClick={onLogout}
              aria-label="Logout"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="preview__user-info">
            <span className="preview__username">Loading...</span>
            <button
              type="button"
              className="preview__logout-btn"
              onClick={onLogout}
              aria-label="Logout"
              disabled
            >
              Logout
            </button>
          </div>
        )}
      </div>

      <div className="preview">
        {backgroundUrl && (
          <img className="preview__bg-img" src={backgroundUrl} alt="" aria-hidden />
        )}
        
        {/* Title - fixed position (matches UploadCV) */}
        <h1 className="preview__title">Portify.</h1>

        <div className="preview__container">
          <div className="preview__body" ref={bodyRef}>
            {/* The moving line */}
            <div className="preview__scroll-indicator" aria-hidden ref={indicatorRef} />
            {previewArea}
          </div>
        </div>
      </div>
    </>
  )
}