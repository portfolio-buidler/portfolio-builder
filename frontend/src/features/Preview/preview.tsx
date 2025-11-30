/**
 * Preview Component (Protected)
 * 
 * Displays CV preview with authentication protection:
 * - Only authenticated users can access this page
 * - Redirects to login if not authenticated
 * - Displays preview of uploaded CV
 */

import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import backgroundImage from '../../assets/aea027abbda7eb6100dda02bdd2e253f3a73b6c8.jpg'
import { PreviewView } from './Preview.view.tsx'
import type { PreviewViewProps } from './Preview.types.ts'
import PreviewArea from './PreviewArea/PreviewArea.tsx'
import { useAuthStore } from '../../store/authStore'

function Preview() {
  const navigate = useNavigate()
  
  // Use global auth store (same pattern as UploadCV)
  const { user, isAuthenticated, isBootstrapped, isLoading, logout } = useAuthStore()

  /**
   * Redirect to login if not authenticated (after store is bootstrapped and not loading)
   * Give token refresh a chance to complete before redirecting
   */
  useEffect(() => {
    // Wait for bootstrap and loading to complete before checking auth
    if (isBootstrapped && !isLoading && !isAuthenticated) {
      // Small delay to allow token refresh to complete if it's in progress
      const timer = setTimeout(() => {
        console.log('[Preview] User not authenticated after delay, redirecting to login')
        navigate('/login', { state: { from: '/preview' }, replace: true })
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [isBootstrapped, isLoading, isAuthenticated, navigate])

  /**
   * Handle logout
   */
  const handleLogout = useCallback(async () => {
    await logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  // Show nothing while auth store is bootstrapping
  if (!isBootstrapped) {
    return null
  }

  // Always render the view - auth section will show even if user is null
  // This ensures the auth section is always visible while token refresh happens
  const viewProps: PreviewViewProps = {
    backgroundUrl: backgroundImage,
    previewArea: isAuthenticated ? <PreviewArea /> : null, // Only show preview area if authenticated
    user: user || null, // Pass null if user not loaded yet (token refresh in progress)
    onLogout: handleLogout,
  }

  return <PreviewView {...viewProps} />
}

export default Preview