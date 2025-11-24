export interface RegistrationFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

export interface RegistrationViewProps {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  showPassword: boolean
  errors: {
    firstName?: string
    lastName?: string
    email?: string
    password?: string
    confirmPassword?: string
    general?: string
  }
  isLoading: boolean
  hasPendingUpload: boolean
  isFormValid: boolean
  onFirstNameChange: (value: string) => void
  onLastNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onShowPasswordToggle: () => void
  onSubmit: (e: React.FormEvent) => void
  onBack: () => void
  onLoginClick: () => void
  backgroundUrl: string
}

export interface RegistrationProps {
  onBack?: () => void
}
