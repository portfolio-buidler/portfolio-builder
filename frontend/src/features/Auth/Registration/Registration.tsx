import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { RegistrationView } from './Registration.view.tsx'
import type { RegistrationProps, RegistrationViewProps } from './Registration.types.ts'
import { 
  registerUser, 
  isValidEmail, 
  validatePassword
} from '../../../services/AuthService'
import { useResumeStore } from '../../../store/resumeStore'
import { mapBackendError } from '../../../utils/errorMapping'
import backgroundImage from '../../../assets/aea027abbda7eb6100dda02bdd2e253f3a73b6c8.jpg'

export const Registration: React.FC<RegistrationProps> = ({ onBack }) => {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Extract hasPendingUpload from location state (if user came from upload page)
  const locationState = location.state as { hasPendingUpload?: boolean, from?: string }
  const hasPendingUpload = locationState?.hasPendingUpload || false
  
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

  // Clear password error when user types a valid password
  useEffect(() => {
    if (password && errors.password) {
      const passwordValidation = validatePassword(password)
      if (passwordValidation.valid) {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors.password
          return newErrors
        })
      }
    }
  }, [password, errors.password])

  // Clear confirmPassword error when passwords match
  useEffect(() => {
    if (confirmPassword && errors.confirmPassword) {
      if (password === confirmPassword) {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors.confirmPassword
          return newErrors
        })
      }
    }
  }, [password, confirmPassword, errors.confirmPassword])

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
        // Combine firstName and lastName into fullName
        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        
        await registerUser({
          fullName,
          email: email.trim(),
          password,
        })

        console.log('[Registration] Registration successful, redirecting to login')

        // Check if there's a pending guest upload
        const { tempUploadId } = useResumeStore.getState()
        const hasPendingUpload = !!tempUploadId

        // After successful registration, redirect to login page
        // User needs to login with their new credentials
        navigate('/login', { 
          replace: true,
          state: {
            from: location.state?.from || '/upload',
            registrationSuccess: true,
            email: email.trim(), // Pre-fill email in login form
            hasPendingUpload, // Pass along pending upload info
          }
        })
      } catch (err) {
        const mappedError = mapBackendError(err, 'register')
        
        // Check if we have field-specific errors
        if (mappedError.fieldErrors) {
          setErrors({
            general: mappedError.message,
            ...mappedError.fieldErrors,
          })
        } else {
          setErrors({
            general: mappedError.message,
          })
        }
        // Don't navigate on error - stay on registration page
        return
      } finally {
        setIsLoading(false)
      }
    },
    [firstName, lastName, email, password, validateForm, navigate, location]
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
    const locationState = location.state as { from?: string; hasPendingUpload?: boolean };
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
