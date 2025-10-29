import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoginView } from './Login.view'
import type { LoginProps, LoginViewProps } from './Login.types'
import { loginUser, isValidEmail } from '../../../services/AuthService'
import backgroundImage from '../../../assets/aea027abbda7eb6100dda02bdd2e253f3a73b6c8.jpg'

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onBack }) => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      // Validate email format
      if (!email.trim()) {
        setError('Email is required')
        return
      }

      if (!isValidEmail(email)) {
        setError('Please enter a valid email address')
        return
      }

      // Validate password
      if (!password) {
        setError('Password is required')
        return
      }

      setIsLoading(true)

      try {
        await loginUser({ email, password })
        
        // Success - call callback or navigate
        if (onLoginSuccess) {
          onLoginSuccess()
        } else {
          navigate('/upload')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed')
      } finally {
        setIsLoading(false)
      }
    },
    [email, password, navigate, onLoginSuccess]
  )

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack()
    } else {
      navigate('/upload')
    }
  }, [navigate, onBack])

  const handleForgotPassword = useCallback(() => {
    // TODO: Implement forgot password flow
    console.log('Forgot password clicked')
  }, [])

  const handleGoogleSignIn = useCallback(() => {
    // TODO: Implement Google sign-in
    console.log('Google sign-in clicked')
  }, [])

  const viewProps: LoginViewProps = {
    email,
    password,
    showPassword,
    error,
    isLoading,
    onEmailChange: setEmail,
    onPasswordChange: setPassword,
    onShowPasswordToggle: () => setShowPassword(!showPassword),
    onSubmit: handleSubmit,
    onBack: handleBack,
    onForgotPassword: handleForgotPassword,
    onGoogleSignIn: handleGoogleSignIn,
    backgroundUrl: backgroundImage,
  }

  return <LoginView {...viewProps} />
}

export default Login