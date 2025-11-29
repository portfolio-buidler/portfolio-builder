// Dashboard.view.tsx
import React, { useEffect, useRef, useState } from 'react'
import type { DashboardViewProps } from './Dashboard.types'
import { Sidebar } from './components/Sidebar/Sidebar'
import { EditorToolbar } from './components/EditorToolbar/EditorToolbar'
import { ResumePreview } from './components/ResumePreview/ResumePreview'
import './Dashboard.styles.scss'

// Hamburger menu icon
const HamburgerIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

// Close icon
const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

export const DashboardView: React.FC<DashboardViewProps> = ({
  backgroundUrl,
  user,
  menuItems,
  activeMenuItem,
  onMenuItemClick,
  onSave,
  isSaving,
  mode,
  onModeChange,
  onUndo,
  onRedo,
  undoAvailable,
  redoAvailable,
  onColorClick,
  onTypographyClick,
  resumeData,
  onResumeDataChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--dashboard-bg', `url(${backgroundUrl})`)
    }
  }, [backgroundUrl])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isSidebarOpen && !(e.target as Element).closest('.dashboard-sidebar') && 
          !(e.target as Element).closest('.dashboard__menu-toggle')) {
        setIsSidebarOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isSidebarOpen])

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false)
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isSidebarOpen])

  const handleNeedHelp = () => {
    console.log('[Dashboard] Need help clicked')
    // TODO: Open help modal or chat
  }

  const handleMenuItemClickWithClose = (id: string) => {
    onMenuItemClick(id)
    setIsSidebarOpen(false) // Close sidebar on mobile after selecting
  }

  return (
    <div ref={containerRef} className="dashboard">
      {/* Mobile Menu Toggle */}
      <button
        type="button"
        className="dashboard__menu-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isSidebarOpen}
      >
        {isSidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
      </button>

      {/* Logo */}
      <h1 className="dashboard__logo">Portify.</h1>

      {/* Mobile Overlay */}
      {isSidebarOpen && <div className="dashboard__overlay" onClick={() => setIsSidebarOpen(false)} />}

      {/* Sidebar */}
      <Sidebar
        user={user}
        menuItems={menuItems}
        activeMenuItem={activeMenuItem}
        onMenuItemClick={handleMenuItemClickWithClose}
        onSave={onSave}
        isSaving={isSaving}
        onNeedHelp={handleNeedHelp}
        isOpen={isSidebarOpen}
      />

      {/* Main Content */}
      <main className="dashboard__main">
        {/* Editor Toolbar */}
        <EditorToolbar
          mode={mode}
          onModeChange={onModeChange}
          onUndo={onUndo}
          onRedo={onRedo}
          undoAvailable={undoAvailable}
          redoAvailable={redoAvailable}
          onColorClick={onColorClick}
          onTypographyClick={onTypographyClick}
        />

        {/* Resume Preview/Editor */}
        <div className="dashboard__content">
          <ResumePreview
            data={resumeData}
            mode={mode}
            onDataChange={onResumeDataChange}
          />
        </div>
      </main>
    </div>
  )
}

export default DashboardView

