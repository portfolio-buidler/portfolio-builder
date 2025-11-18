import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LoginView } from './Login.view'
import type { LoginProps, LoginViewProps } from './Login.types'
import { 
  loginUser, 
  isValidEmail
} from '../../../services/AuthService'
import backgroundImage from '../../../assets/aea027abbda7eb6100dda02bdd2e253f3a73b6c8.jpg'

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onBack }) => {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)

  // Check if there's a pending upload
  const [hasPendingUpload, setHasPendingUpload] = useState(false)

  // Update form validity when email or password changes
  useEffect(() => {
    const isValid = email.trim().length > 0 && password.length > 0 && isValidEmail(email)
    setIsFormValid(isValid)
  }, [email, password])

  useEffect(() => {
    // Check for pending upload from location state only
    const locationState = location.state as any
    const pendingFromState = locationState?.hasPendingUpload
    
    if (pendingFromState) {
      setHasPendingUpload(true)
      console.log('[Login] Pending upload detected from location state')
    }
  }, [location])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      // Validate email format
      if (!email.trim() || !password || !isValidEmail(email)) {
        setError('Invalid email or password')
        return
      }

      setIsLoading(true)

      try {
        const user = await loginUser({ email, password })
        
        console.log('[Login] Login successful:', user.email)
        
        // Determine where to redirect
        const locationState = location.state as any
        const from = locationState?.from || '/upload'
        
        // Success - call callback or navigate
        if (onLoginSuccess) {
          onLoginSuccess()
        } else {
          // If there's a pending upload, always go to upload page
          // The UploadCV component will handle the pending upload automatically
          if (hasPendingUpload) {
            console.log('[Login] Redirecting to upload page to process pending CV')
            navigate('/upload', { replace: true })
          } else {
            navigate(from, { replace: true })
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid email or password')
      } finally {
        setIsLoading(false)
      }
    },
    [email, password, navigate, onLoginSuccess, location, hasPendingUpload]
  )

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack()
    } else {
      // Go back in browser history
      // This naturally handles all navigation paths:
      // - From Upload → Login → Back goes to Upload
      // - From Registration → Login → Back goes to Registration
      navigate(-1)
    }
  }, [navigate, onBack])

  const handleForgotPassword = useCallback(() => {
    // TODO: Implement forgot password flow
    console.log('[Login] Forgot password clicked')
  }, [])

  const handleGoogleSignIn = useCallback(() => {
    // TODO: Implement Google sign-in
    console.log('[Login] Google sign-in clicked')
  }, [])

  const handleSignUpClick = useCallback(() => {
    // Navigate to registration, preserving the pending upload state
    const locationState = location.state as any
    navigate('/registration', { 
      state: { 
        from: locationState?.from || '/upload',
        hasPendingUpload: hasPendingUpload || locationState?.hasPendingUpload
      } 
    })
  }, [navigate, location, hasPendingUpload])

  const viewProps: LoginViewProps = {
    email,
    password,
    showPassword,
    error,
    isLoading,
    hasPendingUpload,
    isFormValid,
    onEmailChange: setEmail,
    onPasswordChange: setPassword,
    onShowPasswordToggle: () => setShowPassword(!showPassword),
    onSubmit: handleSubmit,
    onBack: handleBack,
    onForgotPassword: handleForgotPassword,
    onGoogleSignIn: handleGoogleSignIn,
    onSignUpClick: handleSignUpClick,
    backgroundUrl: backgroundImage,
  }

  return <LoginView {...viewProps} />
}

export default Login
