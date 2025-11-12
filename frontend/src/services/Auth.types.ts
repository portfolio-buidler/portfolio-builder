/**
 * Authentication Type Definitions
 */

export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  fullName: string
  createdAt: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegistrationData {
  firstName: string
  lastName: string
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