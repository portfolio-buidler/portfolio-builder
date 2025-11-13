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
  const [isFormValid, setIsFormValid] = useState(false)

  // Check if there's a pending upload
  const [hasPendingUpload, setHasPendingUpload] = useState(false)

  // Update form validity when fields change
  useEffect(() => {
    const isValid = 
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      email.trim().length > 0 &&
      isValidEmail(email) &&
      password.length > 0 &&
      confirmPassword.length > 0 &&
      password === confirmPassword &&
      validatePassword(password).valid
    
    setIsFormValid(isValid)
  }, [firstName, lastName, email, password, confirmPassword])

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

        // After successful registration, redirect to login page
        // User needs to login with their new credentials
        navigate('/login', { 
          replace: true,
          state: {
            from: location.state?.from || '/upload',
            hasPendingUpload: hasPendingUpload,
            registrationSuccess: true
          }
        })
      } catch (err) {
        setErrors({
          general: err instanceof Error ? err.message : 'Registration failed',
        })
      } finally {
        setIsLoading(false)
      }
    },
    [firstName, lastName, email, password, validateForm, navigate, location, hasPendingUpload]
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
    isFormValid,
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
