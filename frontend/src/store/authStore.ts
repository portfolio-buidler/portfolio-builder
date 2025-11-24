/**
 * Authentication Store - Global State Management
 * 
 * Manages authentication state using Zustand with automatic session restoration.
 */

import { create } from 'zustand';
import type { User } from '../services/Auth.types';
import { getCurrentUser, logoutUser } from '../services/AuthService';

interface AuthStore {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBootstrapped: boolean;
  error: string | null;
  _fetchPromise: Promise<void> | null;

  // Actions
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  markBootstrapped: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isBootstrapped: false,
  error: null,
  _fetchPromise: null,

  // Set user directly (used after login/registration)
  setUser: (user) =>
    set({
      user,
      isAuthenticated: user !== null,
      isBootstrapped: true,
      error: null,
    }),

  // Fetch current user from API
  fetchUser: async () => {
    // Deduplication: if a fetch is already in progress, return that promise
    const state = get();
    if (state._fetchPromise) {
      return state._fetchPromise;
    }
    
    // Create new fetch promise
    const fetchPromise = (async () => {
      set({ isLoading: true, error: null });

      try {
        const user = await getCurrentUser();
        
        set({
          user,
          isAuthenticated: user !== null,
          isLoading: false,
          isBootstrapped: true,
          _fetchPromise: null,
        });
      } catch (error: unknown) {
        const err = error as { message?: string };
        const message = err?.message || 'Failed to fetch user';
        
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isBootstrapped: true,
          error: message,
          _fetchPromise: null,
        });
      }
    })();

    // Store promise for deduplication
    set({ _fetchPromise: fetchPromise });
    
    return fetchPromise;
  },

  // Logout and clear user state
  logout: async () => {
    set({ isLoading: true, error: null });

    try {
      await logoutUser();
      
      // Clear auth state
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isBootstrapped: true,
      });
      
      // Clear all related stores
      const { useResumeStore } = await import('./resumeStore');
      useResumeStore.getState().clearResumeData();
      useResumeStore.getState().clearTempUpload();
      
      // Set manual logout sentinel to prevent auto-restore on next page load
      try {
        localStorage.setItem('auth:manualLogout', 'true');
      } catch (e) {
        console.error('[authStore] Failed to set localStorage flag:', e);
      }
      
    } catch (error: unknown) {
      const err = error as { message?: string };
      const message = err?.message || 'Logout failed';
      
      // Still clear user and stores even if logout request fails
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isBootstrapped: true,
        error: message,
      });
      
      // Clear stores even on error
      const { useResumeStore } = await import('./resumeStore');
      useResumeStore.getState().clearResumeData();
      useResumeStore.getState().clearTempUpload();
      
      try {
        localStorage.setItem('auth:manualLogout', 'true');
      } catch (e) {
        console.error('[authStore] Failed to set localStorage flag:', e);
      }
    }
  },

  markBootstrapped: () => set({ isBootstrapped: true, isLoading: false }),

  // Clear error message
  clearError: () => set({ error: null }),
}));
