/**
 * Check if user is currently authenticated
 *
 * @returns true if access token exists in memory
 */
import { getAccessToken } from './api';
export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}
/**
 * Authentication Service - Real API Integration
 * 
 * Handles user authentication with backend API:
 * - JWT access tokens (15 min, stored in memory)
 * - HttpOnly refresh tokens (7 days, stored in cookies by backend)
 * - Automatic token refresh on expiration
 * - Secure logout with token revocation
 */

import type { User, LoginCredentials, RegistrationData } from './Auth.types';
import { api, setAccessToken, clearAccessToken } from './api';

/**
 * Email validation helper
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Password validation helper
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 12) {
    return { valid: false, error: 'Password must be at least 12 characters long' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one letter' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  return { valid: true };
}

/**
 * Register a new user
 * 
 * @param data - Registration data (fullName, email, password)
 * @throws Error if registration fails (email exists, validation error, etc.)
 */
export async function registerUser(data: RegistrationData): Promise<void> {
  try {
    await api.post('auth/register', {
      email: data.email,
      password: data.password,
      full_name: data.fullName,
    });
  } catch (error: any) {
    const message = error?.response?.data?.detail || 'Registration failed';
    console.error('[AuthService] Registration error:', message);
    throw new Error(message);
  }
}

/**
 * Login user and store access token
 * 
 * @param credentials - Login credentials (email, password)
 * @returns User object from backend
 * @throws Error if login fails (invalid credentials, network error, etc.)
 */
export async function loginUser(credentials: LoginCredentials): Promise<User> {
  try {
    // Login and receive access token
    const loginResponse = await api.post('auth/login', {
      email: credentials.email,
      password: credentials.password,
    });
    
    const { access_token } = loginResponse.data;
    
    // Store access token in memory
    setAccessToken(access_token);
    
    // Clear manual logout sentinel (user explicitly logged back in)
    try { 
      localStorage.removeItem('auth:manualLogout');
    } catch (e) {
      console.error('[AuthService] Login: failed to clear localStorage flag', e);
    }
    
    // Fetch user profile with the new token
    const userResponse = await api.get('auth/me');
    const user: User = userResponse.data;
    
    return user;
  } catch (error: any) {
    const message = error?.response?.data?.detail || 'Login failed';
    console.error('[AuthService] Login error:', message);
    clearAccessToken();
    throw new Error(message);
  }
}

/**
 * Get current authenticated user
 * 
 * @returns User object or null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await api.get('auth/me');
    return response.data;
  } catch (error: any) {
    console.warn('[AuthService] Failed to get current user');
    return null;
  }
}

/**
 * Logout user and revoke refresh token
 * 
 * Clears access token from memory and revokes refresh token cookie on backend
 */
export async function logoutUser(): Promise<void> {
  try {
    // Call logout endpoint to revoke refresh token + clear cookie
    await api.post('auth/logout');
  } catch (error: any) {
    console.warn('[AuthService] Logout: backend request failed:', error?.message);
  } finally {
    // Always clear local token and set manual logout sentinel
    clearAccessToken();
    try { 
      localStorage.setItem('auth:manualLogout', 'true');
    } catch (e) {
      console.error('[AuthService] Logout: failed to set localStorage flag', e);
    }
  }
}

/**
 * Update user profile
 * 
 * @param updates - Partial user data to update
 * @returns Updated user object
 * @throws Error if update fails
 */
export async function updateUserProfile(updates: Partial<User>): Promise<User> {
  try {
    const response = await api.patch('auth/me', updates);
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.detail || 'Profile update failed';
    console.error('[AuthService] Profile update error:', message);
    throw new Error(message);
  }
}

/**
 * Change user password
 * 
 * @param oldPassword - Current password
 * @param newPassword - New password
 * @param revokeAllSessions - Whether to logout from all devices
 * @throws Error if password change fails
 */
export async function changePassword(
  oldPassword: string,
  newPassword: string,
  revokeAllSessions: boolean = false
): Promise<void> {
  try {
    await api.post('auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
      revoke_all_sessions: revokeAllSessions,
    });
    
    // If all sessions revoked, clear local token
    if (revokeAllSessions) {
      clearAccessToken();
    }
  } catch (error: any) {
    const message = error?.response?.data?.detail || 'Password change failed';
    console.error('[AuthService] Password change error:', message);
    throw new Error(message);
  }
}
