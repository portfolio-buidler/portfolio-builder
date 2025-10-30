/**
 * Preview Component (Refactored)
 * 
 * Displays CV preview with authentication integration:
 * - Shows Login/Registration buttons when not authenticated
 * - Shows username and logout when authenticated
 * - Loads user's existing CV if available
 * - Displays preview of newly uploaded CV
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import backgroundImage from '../../assets/aea027abbda7eb6100dda02bdd2e253f3a73b6c8.jpg'
import { PreviewView } from './Preview.view.tsx'
import type { PreviewViewProps, User } from './Preview.types.ts'
import PreviewArea from './PreviewArea/PreviewArea.tsx'
import { isAuthenticated, getCurrentUser, logoutUser } from '../../services/AuthService.ts'
import { toast } from 'react-toastify'

function Preview() {
  const navigate = useNavigate()

  // Authentication state
  const [user, setUser] = useState<User | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  /**
   * Check authentication on mount
   */
  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        try {
          const currentUser = await getCurrentUser()
          setUser(currentUser)
          console.log('[Preview] User authenticated:', currentUser.fullName)
        } catch (error) {
          console.error('[Preview] Failed to get current user:', error)
          setUser(null)
        }
      } else {
        console.log('[Preview] User not authenticated')
      }
      setAuthChecked(true)
    }
    checkAuth()
  }, [])

  /**
   * Auth handlers
   */
  const handleLogin = useCallback(() => {
    navigate('/login', { state: { from: '/preview' } })
  }, [navigate])

  const handleRegister = useCallback(() => {
    navigate('/registration', { state: { from: '/preview' } })
  }, [navigate])

  const handleLogout = useCallback(async () => {
    try {
      await logoutUser()
      setUser(null)
      toast.success('Logged out successfully')
      
      // Redirect to upload page after logout
      navigate('/upload')
    } catch (error) {
      console.error('[Preview] Logout error:', error)
      toast.error('Failed to logout')
    }
  }, [navigate])

  // Don't render until auth check is complete
  if (!authChecked) {
    return null
  }

  const viewProps: PreviewViewProps = {
    backgroundUrl: backgroundImage,
    previewArea: <PreviewArea />,
    user,
    onLogin: handleLogin,
    onRegister: handleRegister,
    onLogout: handleLogout,
  }

  return <PreviewView {...viewProps} />
}

export default Preview