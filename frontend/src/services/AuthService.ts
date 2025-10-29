/**
 * Mock Authentication Service
 * Simulates backend authentication with JWT tokens
 * Access Token: 1 minute expiry
 * Refresh Token: 5 minutes expiry
 */

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  fullName: string
  createdAt: string
}

interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

interface LoginResponse {
  user: User
  tokens: AuthTokens
}

interface RegisterResponse {
  user: User
  tokens: AuthTokens
}

interface RefreshResponse {
  accessToken: string
  expiresIn: number
}

// Mock user database
const mockUsers: Map<string, { id: number; email: string; password: string; firstName: string; lastName: string; createdAt: string }> = new Map()

// Mock refresh tokens storage
const mockRefreshTokens: Map<string, { userId: number; expiresAt: number }> = new Map()

let userIdCounter = 1

/**
 * Generate a mock JWT token
 */
const generateToken = (userId: number, email: string, expiresInMinutes: number): string => {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Date.now()
  const payload = {
    sub: userId.toString(),
    email,
    iat: Math.floor(now / 1000),
    exp: Math.floor(now / 1000) + expiresInMinutes * 60,
  }

  // Simple base64 encoding for mock (NOT SECURE - only for demo)
  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(payload))
  const signature = btoa(`${encodedHeader}.${encodedPayload}.mock-signature`)

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

/**
 * Decode a mock JWT token
 */
const decodeToken = (token: string): { sub: string; email: string; exp: number } | null => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = JSON.parse(atob(parts[1]))
    return payload
  } catch {
    return null
  }
}

/**
 * Validate token expiry
 */
const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token)
  if (!decoded) return true

  const now = Math.floor(Date.now() / 1000)
  return decoded.exp < now
}

/**
 * Register a new user
 */
export const registerUser = async (data: {
  firstName: string
  lastName: string
  email: string
  password: string
}): Promise<RegisterResponse> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Check if user already exists
  if (mockUsers.has(data.email.toLowerCase())) {
    throw new Error('User with this email already exists')
  }

  // Validate password
  if (data.password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }
  if (!/[a-zA-Z]/.test(data.password) || !/[0-9]/.test(data.password)) {
    throw new Error('Password must include a letter and a number')
  }

  // Create new user
  const userId = userIdCounter++
  const user = {
    id: userId,
    email: data.email.toLowerCase(),
    password: data.password, // In real app, this would be hashed
    firstName: data.firstName,
    lastName: data.lastName,
    createdAt: new Date().toISOString(),
  }

  mockUsers.set(user.email, user)

  // Generate tokens
  const accessToken = generateToken(user.id, user.email, 1) // 1 minute
  const refreshToken = generateToken(user.id, user.email, 5) // 5 minutes

  // Store refresh token
  mockRefreshTokens.set(refreshToken, {
    userId: user.id,
    expiresAt: Date.now() + 5 * 60 * 1000,
  })

  // Store tokens in cookies (simulated via localStorage for demo)
  localStorage.setItem('accessToken', accessToken)
  localStorage.setItem('refreshToken', refreshToken)

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      createdAt: user.createdAt,
    },
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: 60, // seconds
    },
  }
}

/**
 * Login user
 */
export const loginUser = async (data: { email: string; password: string }): Promise<LoginResponse> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  const user = mockUsers.get(data.email.toLowerCase())

  if (!user || user.password !== data.password) {
    throw new Error('Invalid email or password')
  }

  // Generate tokens
  const accessToken = generateToken(user.id, user.email, 1) // 1 minute
  const refreshToken = generateToken(user.id, user.email, 5) // 5 minutes

  // Store refresh token
  mockRefreshTokens.set(refreshToken, {
    userId: user.id,
    expiresAt: Date.now() + 5 * 60 * 1000,
  })

  // Store tokens in cookies (simulated via localStorage for demo)
  localStorage.setItem('accessToken', accessToken)
  localStorage.setItem('refreshToken', refreshToken)

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      createdAt: user.createdAt,
    },
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: 60, // seconds
    },
  }
}

/**
 * Refresh access token
 */
export const refreshAccessToken = async (): Promise<RefreshResponse> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) {
    throw new Error('No refresh token found')
  }

  if (isTokenExpired(refreshToken)) {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    throw new Error('Refresh token expired')
  }

  const tokenData = mockRefreshTokens.get(refreshToken)
  if (!tokenData) {
    throw new Error('Invalid refresh token')
  }

  const decoded = decodeToken(refreshToken)
  if (!decoded) {
    throw new Error('Invalid token format')
  }

  // Generate new access token
  const newAccessToken = generateToken(parseInt(decoded.sub), decoded.email, 1)

  // Store new access token
  localStorage.setItem('accessToken', newAccessToken)

  return {
    accessToken: newAccessToken,
    expiresIn: 60,
  }
}

/**
 * Logout user
 */
export const logoutUser = async (): Promise<void> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  const refreshToken = localStorage.getItem('refreshToken')
  if (refreshToken) {
    mockRefreshTokens.delete(refreshToken)
  }

  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

/**
 * Get current user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const accessToken = localStorage.getItem('accessToken')
  if (!accessToken) return null

  if (isTokenExpired(accessToken)) {
    // Try to refresh
    try {
      await refreshAccessToken()
      return getCurrentUser() // Retry with new token
    } catch {
      return null
    }
  }

  const decoded = decodeToken(accessToken)
  if (!decoded) return null

  const user = Array.from(mockUsers.values()).find((u) => u.id === parseInt(decoded.sub))
  if (!user) return null

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
    createdAt: user.createdAt,
  }
}

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const accessToken = localStorage.getItem('accessToken')
  if (!accessToken) return false
  return !isTokenExpired(accessToken)
}

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' }
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: 'Password must include at least one letter' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must include at least one number' }
  }
  return { valid: true }
}