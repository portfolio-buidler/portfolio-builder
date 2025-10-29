export interface LoginFormData {
  email: string
  password: string
}

export interface LoginViewProps {
  email: string
  password: string
  showPassword: boolean
  error: string | null
  isLoading: boolean
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onShowPasswordToggle: () => void
  onSubmit: (e: React.FormEvent) => void
  onBack: () => void
  onForgotPassword: () => void
  onGoogleSignIn: () => void
  backgroundUrl: string
}

export interface LoginProps {
  onLoginSuccess?: () => void
  onBack?: () => void
}