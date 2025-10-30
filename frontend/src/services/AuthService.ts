/**
 * AuthService - Mock Authentication Service
 * 
 * Implements JWT-based authentication with:
 * - Access tokens (2-minute expiry)
 * - Refresh tokens (5-minute expiry)
 * - Automatic token refresh
 * - Temporary CV storage for pre-auth uploads
 */

import type { User, LoginCredentials, RegistrationData, AuthTokens } from '../types/auth.types'

// Token expiry times (in milliseconds)
const ACCESS_TOKEN_EXPIRY = 2 * 60 * 1000 // 2 minutes
const REFRESH_TOKEN_EXPIRY = 5 * 60 * 1000 // 5 minutes

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  ACCESS_TOKEN_EXPIRY: 'auth_access_token_expiry',
  REFRESH_TOKEN_EXPIRY: 'auth_refresh_token_expiry',
  USER_DATA: 'auth_user_data',
  TEMP_CV_FILE: 'temp_cv_file',
  TEMP_CV_METADATA: 'temp_cv_metadata',
  PENDING_UPLOAD_AFTER_AUTH: 'pending_upload_after_auth',
}

// Mock user database
const mockUsers: Map<string, User & { password: string }> = new Map()

// Helper to generate mock JWT token
function generateMockToken(userId: number, type: 'access' | 'refresh'): string {
  const timestamp = Date.now()
  const expiry = type === 'access' ? ACCESS_TOKEN_EXPIRY : REFRESH_TOKEN_EXPIRY
  return `mock_${type}_token_${userId}_${timestamp}_${expiry}`
}

// Helper to parse mock token
function parseMockToken(token: string): { userId: number; timestamp: number; expiry: number } | null {
  try {
    const parts = token.split('_')
    if (parts.length !== 6) return null
    return {
      userId: parseInt(parts[3]),
      timestamp: parseInt(parts[4]),
      expiry: parseInt(parts[5]),
    }
  } catch {
    return null
  }
}

/**
 * Email validation
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Password validation
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' }
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one letter' }
  }
  if (!/\d/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' }
  }
  return { valid: true }
}

/**
 * Store tokens and expiry times
 */
function storeTokens(tokens: AuthTokens): void {
  const now = Date.now()
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken)
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken)
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY, String(now + ACCESS_TOKEN_EXPIRY))
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY, String(now + REFRESH_TOKEN_EXPIRY))
}

/**
 * Get stored tokens
 */
function getStoredTokens(): AuthTokens | null {
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
  
  if (!accessToken || !refreshToken) return null
  
  return { accessToken, refreshToken }
}

/**
 * Clear all auth data
 */
function clearAuthData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    if (key.startsWith('auth_')) {
      localStorage.removeItem(key)
    }
  })
}

/**
 * Check if access token is expired
 */
function isAccessTokenExpired(): boolean {
  const expiry = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY)
  if (!expiry) return true
  return Date.now() >= parseInt(expiry)
}

/**
 * Check if refresh token is expired
 */
function isRefreshTokenExpired(): boolean {
  const expiry = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY)
  if (!expiry) return true
  return Date.now() >= parseInt(expiry)
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<boolean> {
  try {
    const tokens = getStoredTokens()
    if (!tokens) return false
    
    // Check if refresh token is still valid
    if (isRefreshTokenExpired()) {
      clearAuthData()
      return false
    }
    
    // Parse refresh token to get user ID
    const tokenData = parseMockToken(tokens.refreshToken)
    if (!tokenData) return false
    
    // Generate new tokens
    const newAccessToken = generateMockToken(tokenData.userId, 'access')
    const newRefreshToken = generateMockToken(tokenData.userId, 'refresh')
    
    // Store new tokens
    storeTokens({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    })
    
    console.log('[AuthService] Token refreshed successfully')
    return true
  } catch (error) {
    console.error('[AuthService] Token refresh failed:', error)
    return false
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const tokens = getStoredTokens()
  if (!tokens) return false
  
  // If refresh token is expired, clear everything
  if (isRefreshTokenExpired()) {
    clearAuthData()
    return false
  }
  
  // If only access token is expired, we can refresh
  // User is still considered authenticated
  return true
}

/**
 * Get valid access token (with automatic refresh if needed)
 */
export async function getValidAccessToken(): Promise<string | null> {
  const tokens = getStoredTokens()
  if (!tokens) return null
  
  // If access token expired but refresh token valid, refresh
  if (isAccessTokenExpired() && !isRefreshTokenExpired()) {
    const refreshed = await refreshAccessToken()
    if (!refreshed) return null
    
    // Get new access token
    const newTokens = getStoredTokens()
    return newTokens?.accessToken || null
  }
  
  return tokens.accessToken
}

/**
 * Get current user data
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = await getValidAccessToken()
    if (!token) return null
    
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA)
    if (!userData) return null
    
    return JSON.parse(userData)
  } catch (error) {
    console.error('[AuthService] Failed to get current user:', error)
    return null
  }
}

/**
 * Store user data
 */
function storeUserData(user: User): void {
  localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user))
}

/**
 * Register new user
 */
export async function registerUser(data: RegistrationData): Promise<User> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Validate input
  if (!data.email || !isValidEmail(data.email)) {
    throw new Error('Invalid email address')
  }
  
  const passwordValidation = validatePassword(data.password)
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.error)
  }
  
  // Check if user already exists
  if (mockUsers.has(data.email.toLowerCase())) {
    throw new Error('User with this email already exists')
  }
  
  // Create new user
  const userId = mockUsers.size + 1
  const user: User = {
    id: userId,
    email: data.email.toLowerCase(),
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    fullName: `${data.firstName.trim()} ${data.lastName.trim()}`,
    createdAt: new Date().toISOString(),
  }
  
  // Store in mock database
  mockUsers.set(data.email.toLowerCase(), { ...user, password: data.password })
  
  // Generate tokens
  const tokens: AuthTokens = {
    accessToken: generateMockToken(userId, 'access'),
    refreshToken: generateMockToken(userId, 'refresh'),
  }
  
  // Store tokens and user data
  storeTokens(tokens)
  storeUserData(user)
  
  console.log('[AuthService] User registered successfully:', user.email)
  
  return user
}

/**
 * Login user
 */
export async function loginUser(credentials: LoginCredentials): Promise<User> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Validate input
  if (!credentials.email || !isValidEmail(credentials.email)) {
    throw new Error('Invalid email address')
  }
  
  if (!credentials.password) {
    throw new Error('Password is required')
  }
  
  // Check if user exists
  const userRecord = mockUsers.get(credentials.email.toLowerCase())
  if (!userRecord) {
    throw new Error('Invalid email or password')
  }
  
  // Verify password
  if (userRecord.password !== credentials.password) {
    throw new Error('Invalid email or password')
  }
  
  // Extract user data (without password)
  const { password, ...user } = userRecord
  
  // Generate tokens
  const tokens: AuthTokens = {
    accessToken: generateMockToken(user.id, 'access'),
    refreshToken: generateMockToken(user.id, 'refresh'),
  }
  
  // Store tokens and user data
  storeTokens(tokens)
  storeUserData(user)
  
  console.log('[AuthService] User logged in successfully:', user.email)
  
  return user
}

/**
 * Logout user
 */
export async function logoutUser(): Promise<void> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200))
  
  console.log('[AuthService] User logged out')
  clearAuthData()
}

/**
 * Temporary CV Storage (for pre-auth uploads)
 */

export interface TempCVMetadata {
  fileName: string
  fileSize: number
  fileType: string
  uploadedAt: string
}

/**
 * Store CV file temporarily before authentication
 */
export function storeTempCV(file: File): void {
  // Store file metadata (we can't actually store File objects in localStorage)
  const metadata: TempCVMetadata = {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    uploadedAt: new Date().toISOString(),
  }
  
  // Store metadata
  sessionStorage.setItem(STORAGE_KEYS.TEMP_CV_METADATA, JSON.stringify(metadata))
  
  // Store file as base64 (for mock purposes)
  const reader = new FileReader()
  reader.onload = () => {
    const base64 = reader.result as string
    sessionStorage.setItem(STORAGE_KEYS.TEMP_CV_FILE, base64)
  }
  reader.readAsDataURL(file)
  
  console.log('[AuthService] CV stored temporarily:', metadata.fileName)
}

/**
 * Get temporarily stored CV
 */
export function getTempCV(): { file: File; metadata: TempCVMetadata } | null {
  try {
    const metadataStr = sessionStorage.getItem(STORAGE_KEYS.TEMP_CV_METADATA)
    const fileData = sessionStorage.getItem(STORAGE_KEYS.TEMP_CV_FILE)
    
    if (!metadataStr || !fileData) return null
    
    const metadata: TempCVMetadata = JSON.parse(metadataStr)
    
    // Convert base64 back to File object
    const arr = fileData.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1] || metadata.fileType
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    const file = new File([u8arr], metadata.fileName, { type: mime })
    
    return { file, metadata }
  } catch (error) {
    console.error('[AuthService] Failed to retrieve temp CV:', error)
    return null
  }
}

/**
 * Clear temporarily stored CV
 */
export function clearTempCV(): void {
  sessionStorage.removeItem(STORAGE_KEYS.TEMP_CV_FILE)
  sessionStorage.removeItem(STORAGE_KEYS.TEMP_CV_METADATA)
  console.log('[AuthService] Temporary CV cleared')
}

/**
 * Check if there's a temporarily stored CV
 */
export function hasTempCV(): boolean {
  return sessionStorage.getItem(STORAGE_KEYS.TEMP_CV_METADATA) !== null
}

/**
 * Set pending upload flag (to continue upload after auth)
 */
export function setPendingUploadAfterAuth(pending: boolean): void {
  if (pending) {
    sessionStorage.setItem(STORAGE_KEYS.PENDING_UPLOAD_AFTER_AUTH, 'true')
  } else {
    sessionStorage.removeItem(STORAGE_KEYS.PENDING_UPLOAD_AFTER_AUTH)
  }
}

/**
 * Check if there's a pending upload after auth
 */
export function hasPendingUploadAfterAuth(): boolean {
  return sessionStorage.getItem(STORAGE_KEYS.PENDING_UPLOAD_AFTER_AUTH) === 'true'
}

/**
 * Initialize mock users for development
 */
export function initMockUsers(): void {
  // Add some test users
  mockUsers.set('test@example.com', {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    fullName: 'Test User',
    createdAt: new Date().toISOString(),
    password: 'Password123',
  })
  
  mockUsers.set('john@example.com', {
    id: 2,
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
    createdAt: new Date().toISOString(),
    password: 'JohnDoe123',
  })
  
  console.log('[AuthService] Mock users initialized')
}

// Initialize mock users on module load
if (import.meta.env.DEV) {
  initMockUsers()
}