/**
 * Authentication Store - Global State Management
 * 
 * Manages authentication state across the application using Zustand.
 * Provides centralized user data and authentication status.
 */

import { create } from 'zustand';
import type { User } from '../services/Auth.types';
import { getCurrentUser, logoutUser } from '../services/AuthService';

interface AuthStore {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

/**
 * Global authentication store
 * 
 * Usage:
 * ```typescript
 * const { user, isAuthenticated, fetchUser } = useAuthStore();
 * 
 * useEffect(() => {
 *   fetchUser(); // Load user on mount
 * }, []);
 * ```
 */
export const useAuthStore = create<AuthStore>((set) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Set user directly (used after login/registration)
  setUser: (user) =>
    set({
      user,
      isAuthenticated: user !== null,
      error: null,
    }),

  // Fetch current user from API
  fetchUser: async () => {
    set({ isLoading: true, error: null });

    try {
      const user = await getCurrentUser();
      
      set({
        user,
        isAuthenticated: user !== null,
        isLoading: false,
      });
    } catch (error: any) {
      const message = error?.message || 'Failed to fetch user';
      
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: message,
      });
    }
  },

  // Logout and clear user state
  logout: async () => {
    set({ isLoading: true, error: null });

    try {
      await logoutUser();
      
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error: any) {
      const message = error?.message || 'Logout failed';
      
      // Still clear user even if logout request fails
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: message,
      });
    }
  },

  // Clear error message
  clearError: () => set({ error: null }),
}));
