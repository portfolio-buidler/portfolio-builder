import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { RegistrationView } from './Registration.view.tsx'
import type { RegistrationProps, RegistrationViewProps } from './Registration.types.ts'
import { 
  registerUser, 
  isValidEmail, 
  validatePassword,
  hasPendingUploadAfterAuth,
  getTempCV 
} from '../../../services/AuthService'
import backgroundImage from '../../../assets/aea027abbda7eb6100dda02bdd2e253f3a73b6c8.jpg'

export const Registration: React.FC<RegistrationProps> = ({ onRegistrationSuccess, onBack }) => {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{
    firstName?: string
    lastName?: string
    email?: string
    password?: string
    confirmPassword?: string
    general?: string
  }>({})
  const [isLoading, setIsLoading] = useState(false)

  // Check if there's a pending upload
  const [hasPendingUpload, setHasPendingUpload] = useState(false)

  useEffect(() => {
    // Check for pending upload from location state or session storage
    const locationState = location.state as any
    const pendingFromState = locationState?.hasPendingUpload
    const pendingFromStorage = hasPendingUploadAfterAuth()
    
    if (pendingFromState || pendingFromStorage) {
      setHasPendingUpload(true)
      
      // Show info about pending upload
      const tempCV = getTempCV()
      if (tempCV) {
        console.log('[Registration] Pending CV upload detected:', tempCV.metadata.fileName)
      }
    }
  }, [location])

  const validateForm = useCallback((): boolean => {
    const newErrors: typeof errors = {}

    // Validate first name
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    // Validate last name
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    // Validate email
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Validate password
    if (!password) {
      newErrors.password = 'Password is required'
    } else {
      const passwordValidation = validatePassword(password)
      if (!passwordValidation.valid) {
        newErrors.password = passwordValidation.error
      }
    }

    // Validate confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [firstName, lastName, email, password, confirmPassword])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setErrors({})

      if (!validateForm()) {
        return
      }

      setIsLoading(true)

      try {
        const user = await registerUser({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password,
        })

        console.log('[Registration] Registration successful:', user.email)

        // Determine where to redirect
        const locationState = location.state as any
        const from = locationState?.from || '/upload'

        // Success - call callback or navigate
        if (onRegistrationSuccess) {
          onRegistrationSuccess()
        } else {
          // If there's a pending upload, always go to upload page
          // The UploadCV component will handle the pending upload automatically
          if (hasPendingUpload) {
            console.log('[Registration] Redirecting to upload page to process pending CV')
            navigate('/upload', { replace: true })
          } else {
            navigate(from, { replace: true })
          }
        }
      } catch (err) {
        setErrors({
          general: err instanceof Error ? err.message : 'Registration failed',
        })
      } finally {
        setIsLoading(false)
      }
    },
    [firstName, lastName, email, password, validateForm, navigate, onRegistrationSuccess, location, hasPendingUpload]
  )

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }, [navigate, onBack])

  const handleLoginClick = useCallback(() => {
    // Navigate to login, preserving the pending upload state
    const locationState = location.state as any
    navigate('/login', { 
      state: { 
        from: locationState?.from || '/upload',
        hasPendingUpload: hasPendingUpload || locationState?.hasPendingUpload
      } 
    })
  }, [navigate, location, hasPendingUpload])

  const viewProps: RegistrationViewProps = {
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    showPassword,
    errors,
    isLoading,
    hasPendingUpload,
    onFirstNameChange: setFirstName,
    onLastNameChange: setLastName,
    onEmailChange: setEmail,
    onPasswordChange: setPassword,
    onConfirmPasswordChange: setConfirmPassword,
    onShowPasswordToggle: () => setShowPassword(!showPassword),
    onSubmit: handleSubmit,
    onBack: handleBack,
    onLoginClick: handleLoginClick,
    backgroundUrl: backgroundImage,
  }

  return <RegistrationView {...viewProps} />
}

export default Registration