/**
 * Dashboard Component (Protected)
 * 
 * Main dashboard screen after user confirms their portfolio preview.
 * Provides:
 * - Sidebar navigation with user info and menu
 * - Resume editor with edit/display modes
 * - Color and typography customization options
 */

import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardView } from './Dashboard.view'
import type { 
  DashboardProps, 
  DashboardViewProps, 
  EditorMode, 
  ResumeData,
  SidebarMenuItem 
} from './Dashboard.types'
import { useAuthStore } from '../../store/authStore'
import { useResumeStore } from '../../store/resumeStore'
import backgroundImage from '../../assets/aea027abbda7eb6100dda02bdd2e253f3a73b6c8.jpg'

// Icons for menu items
const PersonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const LegalIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)


export const Dashboard: React.FC<DashboardProps> = () => {
  const navigate = useNavigate()
  const [isChecking, setIsChecking] = useState(true)
  const { user, fetchUser } = useAuthStore()
  const { resumeData: storedResumeData } = useResumeStore()

  // Editor state
  const [mode, setMode] = useState<EditorMode>('edit')
  const [activeMenuItem, setActiveMenuItem] = useState('personal-info')
  const [isSaving, setIsSaving] = useState(false)

  // History for undo/redo
  const [history, setHistory] = useState<ResumeData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Resume data state
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    // Initialize from stored resume data if available
    const extractedData = storedResumeData?.data?.extractedData as Record<string, unknown> | undefined
    
    return {
      fullName: (extractedData?.name as string) || 'yoad madmoni',
      title: (extractedData?.title as string) || 'full-stack developer',
      headline: 'I Help Companies Turn Messy CV Data Into Clean, Modern Portfolio Websites.',
      avatarUrl: undefined,
      about: (extractedData?.about as string) || "I'm a full-stack developer from Israel, passionate about creating modern, user-friendly applications. I specialize in building scalable systems and enjoy working at the intersection of design and technology. Living in Tel Aviv, I thrive in dynamic startup environments where fast problem-solving and teamwork are essential. In my free time, I like contributing to open-source projects and mentoring junior developers",
      projects: [
        {
          id: '1',
          name: 'Project Name',
          description: 'Completed projects in distributed systems and AI applications.',
          year: '2025',
          tags: ['Next.Js', 'MongoDB'],
          imageUrl: undefined,
        },
        {
          id: '2',
          name: 'Project Name',
          description: 'Completed projects in distributed systems and AI applications.',
          year: '2025',
          tags: ['Micro-interactions', 'Next.Js', 'HTML5', 'Node.Js', 'MongoDB'],
          imageUrl: undefined,
        },
        {
          id: '3',
          name: 'Project Name',
          description: 'Completed projects in distributed systems and AI applications.',
          year: '2025',
          tags: ['Micro-interactions', 'Next.Js', 'HTML5', 'Node.Js', 'MongoDB'],
          imageUrl: undefined,
        },
        {
          id: '4',
          name: 'Project Name',
          description: 'Completed projects in distributed systems and AI applications.',
          year: '2025',
          tags: ['Micro-interactions', 'Next.Js', 'HTML5', 'Node.Js'],
          imageUrl: undefined,
        },
      ],
      education: [
        {
          degree: 'B.Sc. in Computer Science',
          institution: 'Tel Aviv University',
          years: '2017-2020',
          details: [
            'Specialized in software engineering, algorithms, and system design.',
            'Completed projects in distributed systems and AI applications.',
            'Active member of the university\'s programming club, participating in hackathons and coding competitions',
          ],
        },
      ],
      skills: [
        'TypeScript', 'TypeScript', 'TypeScript',
        'TypeScript', 'TypeScript', 'TypeScript',
        'TypeScript', 'TypeScript', 'TypeScript',
      ],
      workExperience: [
        {
          id: '1',
          role: 'Senior Full-Stack Developer',
          company: 'Tech Startup Ltd.',
          years: '2021-Present',
          description: "I'm a full-stack developer from Israel, passionate about creating modern, user-friendly applications. I specialize in building scalable systems and enjoy working at the intersection of design and technology. Living in Tel Aviv, I thrive in dynamic startup environments where fast problem-solving and teamwork are essential. In my free time, I like contributing to open-source projects and mentoring junior developers.",
          achievements: [
            'Led development of microservices architecture serving 100K+ users',
            'Reduced API response time by 40% through optimization',
            'Mentored 5 junior developers',
          ],
        },
        {
          id: '2',
          role: 'Full-Stack Developer',
          company: 'Digital Agency',
          years: '2019-2021',
          description: "I'm a full-stack developer from Israel, passionate about creating modern, user-friendly applications. I specialize in building scalable systems and enjoy working at the intersection of design and technology.",
          achievements: [
            'Developed and maintained 10+ client web applications',
            'Implemented CI/CD pipelines reducing deployment time by 60%',
          ],
        },
      ],
    }
  })

  // Initialize history with initial data
  useEffect(() => {
    if (history.length === 0) {
      setHistory([resumeData])
      setHistoryIndex(0)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Check authentication on mount
   */
  useEffect(() => {
    const checkAuth = async () => {
      await fetchUser()
      setIsChecking(false)
    }
    checkAuth()
  }, [fetchUser])

  useEffect(() => {
    if (!isChecking && !user) {
      console.log('[Dashboard] User not authenticated, redirecting to login')
      navigate('/login', { state: { from: '/dashboard' }, replace: true })
    }
  }, [isChecking, user, navigate])

  // Menu items
  const menuItems: SidebarMenuItem[] = [
    {
      id: 'personal-info',
      label: 'Personal Information',
      icon: <PersonIcon />,
    },
    {
      id: 'legal-privacy',
      label: 'Legal & Privacy',
      icon: <LegalIcon />,
    },
  ]

  // Handlers
  const handleMenuItemClick = useCallback((id: string) => {
    setActiveMenuItem(id)
  }, [])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      // TODO: Implement save to backend
      console.log('[Dashboard] Saving resume data...', resumeData)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      console.log('[Dashboard] Resume saved successfully')
    } catch (error) {
      console.error('[Dashboard] Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }, [resumeData])

  const handleModeChange = useCallback((newMode: EditorMode) => {
    setMode(newMode)
  }, [])

  const handleResumeDataChange = useCallback((newData: ResumeData) => {
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newData)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    setResumeData(newData)
  }, [history, historyIndex])

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setResumeData(history[newIndex])
    }
  }, [history, historyIndex])

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setResumeData(history[newIndex])
    }
  }, [history, historyIndex])

  const handleColorClick = useCallback(() => {
    console.log('[Dashboard] Color customization clicked')
    // TODO: Open color picker modal
  }, [])

  const handleTypographyClick = useCallback(() => {
    console.log('[Dashboard] Typography customization clicked')
    // TODO: Open typography picker modal
  }, [])

  // Show nothing while checking authentication
  if (isChecking) {
    return null
  }

  const viewProps: DashboardViewProps = {
    backgroundUrl: backgroundImage,
    user: {
      name: user?.full_name || user?.email?.split('@')[0] || 'User',
      plan: 'Basic',
      avatarUrl: undefined,
    },
    menuItems,
    activeMenuItem,
    onMenuItemClick: handleMenuItemClick,
    onSave: handleSave,
    isSaving,
    mode,
    onModeChange: handleModeChange,
    onUndo: handleUndo,
    onRedo: handleRedo,
    undoAvailable: historyIndex > 0,
    redoAvailable: historyIndex < history.length - 1,
    onColorClick: handleColorClick,
    onTypographyClick: handleTypographyClick,
    resumeData,
    onResumeDataChange: handleResumeDataChange,
  }

  return <DashboardView {...viewProps} />
}

export default Dashboard

