/**
 * Preview Component (Protected)
 * 
 * Displays CV preview with authentication protection:
 * - Only authenticated users can access this page
 * - Redirects to login if not authenticated
 * - Displays preview of uploaded CV
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import backgroundImage from '../../assets/aea027abbda7eb6100dda02bdd2e253f3a73b6c8.jpg'
import { PreviewView } from './Preview.view.tsx'
import type { PreviewViewProps } from './Preview.types.ts'
import PreviewArea from './PreviewArea/PreviewArea.tsx'
import { isAuthenticated } from '../../services/AuthService.ts'

function Preview() {
  const navigate = useNavigate()
  const [isChecking, setIsChecking] = useState(true)

  /**
   * Check authentication on mount
   * Redirect to login if not authenticated
   */
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        console.log('[Preview] User not authenticated, redirecting to login')
        navigate('/login', { state: { from: '/preview' }, replace: true })
        return
      }
      console.log('[Preview] User authenticated')
      setIsChecking(false)
    }
    checkAuth()
  }, [navigate])

  // Show nothing while checking authentication
  if (isChecking) {
    return null
  }

  const viewProps: PreviewViewProps = {
    backgroundUrl: backgroundImage,
    previewArea: <PreviewArea />,
  }

  return <PreviewView {...viewProps} />
}

export default Preview