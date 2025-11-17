/**
 * Authentication Type Definitions
 * 
 * Note: User interface matches backend's UserPublic schema
 */

export interface User {
  id: number
  email: string
  full_name: string | null
  headline: string | null
  location: string | null
  timezone: string | null
  languages: Record<string, unknown> | null
  phone: string | null
  created_at: string
  updated_at: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegistrationData {
  fullName: string
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}