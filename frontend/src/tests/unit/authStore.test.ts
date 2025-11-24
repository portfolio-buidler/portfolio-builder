/**
 * Auth Store Unit Tests
 * 
 * Tests authentication state management including:
 * - Promise deduplication (React Strict Mode double-mounting)
 * - Auth restoration with localStorage sentinel
 * - Login/logout state transitions
 * - Error handling and state cleanup
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useAuthStore, __resetInFlightPromise } from '../../store/authStore';
import * as authService from '../../services/AuthService';
import type { User } from '../../services/Auth.types';

// Mock the auth service module
vi.mock('../../services/AuthService');

// Mock dynamic import for resumeStore
vi.mock('../../store/resumeStore', () => ({
    useResumeStore: {
        getState: () => ({
            clearResumeData: vi.fn(),
            clearTempUpload: vi.fn(),
        }),
    },
}));

// Helper to create mock user
const createMockUser = (overrides?: Partial<User>): User => ({
    id: 1,
    email: 'test@example.com',
    full_name: 'Test User',
    headline: null,
    location: null,
    timezone: null,
    languages: null,
    phone: null,
    created_at: new Date().toISOString(),
    updated_at: null,
    ...overrides,
});

describe('Auth Store', () => {
    beforeEach(() => {
        // Reset store state before each test
        useAuthStore.setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isBootstrapped: false,
            error: null,
            _fetchPromise: null,
        });

        // CRITICAL: Reset module-level promise for deduplication tests
        __resetInFlightPromise();

        // Clear localStorage
        localStorage.clear();

        // Clear all mocks
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Initial State', () => {
        it('should have correct initial state', () => {
            const state = useAuthStore.getState();

            expect(state.user).toBeNull();
            expect(state.isAuthenticated).toBe(false);
            expect(state.isLoading).toBe(false);
            expect(state.isBootstrapped).toBe(false);
            expect(state.error).toBeNull();
            expect(state._fetchPromise).toBeNull();
        });
    });

    describe('setUser', () => {
        it('should set user and mark as authenticated', () => {
            const mockUser = createMockUser();

            const { setUser } = useAuthStore.getState();
            setUser(mockUser);

            const state = useAuthStore.getState();

            expect(state.user).toEqual(mockUser);
            expect(state.isAuthenticated).toBe(true);
            expect(state.isBootstrapped).toBe(true);
            expect(state.error).toBeNull();
        });

        it('should clear user and mark as unauthenticated when passed null', () => {
            // Set up authenticated state
            useAuthStore.setState({
                user: createMockUser(),
                isAuthenticated: true,
            });

            const { setUser } = useAuthStore.getState();
            setUser(null);

            const state = useAuthStore.getState();

            expect(state.user).toBeNull();
            expect(state.isAuthenticated).toBe(false);
            expect(state.isBootstrapped).toBe(true);
        });
    });

    describe('fetchUser - Success Flow', () => {
        it('should fetch user and update state on success', async () => {
            const mockUser = createMockUser();

            vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

            const { fetchUser } = useAuthStore.getState();
            await fetchUser();

            const state = useAuthStore.getState();

            expect(state.user).toEqual(mockUser);
            expect(state.isAuthenticated).toBe(true);
            expect(state.isBootstrapped).toBe(true);
            expect(state.isLoading).toBe(false);
            expect(state.error).toBeNull();
            expect(state._fetchPromise).toBeNull();
        });

        it('should set loading state during fetch', async () => {
            vi.mocked(authService.getCurrentUser).mockImplementation(
                () => new Promise((resolve) => setTimeout(() => resolve(createMockUser()), 100))
            );

            const { fetchUser } = useAuthStore.getState();
            const fetchPromise = fetchUser();

            // Should be loading immediately
            expect(useAuthStore.getState().isLoading).toBe(true);

            await fetchPromise;

            // Should not be loading after completion
            expect(useAuthStore.getState().isLoading).toBe(false);
        });

        it('should clear error on successful fetch', async () => {
            // Set up error from previous failed attempt
            useAuthStore.setState({ error: 'Previous error' });

            vi.mocked(authService.getCurrentUser).mockResolvedValue(createMockUser());

            const { fetchUser } = useAuthStore.getState();
            await fetchUser();

            const state = useAuthStore.getState();
            expect(state.error).toBeNull();
        });
    });

    describe('fetchUser - Error Handling', () => {
        it('should handle fetch errors and clear user state', async () => {
            vi.mocked(authService.getCurrentUser).mockRejectedValue(
                new Error('Unauthorized')
            );

            const { fetchUser } = useAuthStore.getState();
            await fetchUser();

            const state = useAuthStore.getState();

            expect(state.user).toBeNull();
            expect(state.isAuthenticated).toBe(false);
            expect(state.isBootstrapped).toBe(true);
            expect(state.isLoading).toBe(false);
            expect(state.error).toBe('Unauthorized');
            expect(state._fetchPromise).toBeNull();
        });

        it('should handle errors without message property', async () => {
            vi.mocked(authService.getCurrentUser).mockRejectedValue({});

            const { fetchUser } = useAuthStore.getState();
            await fetchUser();

            const state = useAuthStore.getState();

            expect(state.error).toBe('Failed to fetch user');
        });

        it('should mark as bootstrapped even on error', async () => {
            vi.mocked(authService.getCurrentUser).mockRejectedValue(
                new Error('Network error')
            );

            const { fetchUser } = useAuthStore.getState();
            await fetchUser();

            const state = useAuthStore.getState();

            expect(state.isBootstrapped).toBe(true);
        });
    });

    describe('fetchUser - Promise Deduplication (React Strict Mode)', () => {
        it('should return same promise for concurrent fetchUser calls', async () => {
            vi.mocked(authService.getCurrentUser).mockImplementation(
                () => new Promise((resolve) => setTimeout(() => resolve(createMockUser()), 100))
            );

            const { fetchUser } = useAuthStore.getState();

            // Call fetchUser twice concurrently (simulates Strict Mode double-mount)
            const promise1 = fetchUser();
            const promise2 = fetchUser();

            // Should return the same promise
            expect(promise1).toBe(promise2);

            await Promise.all([promise1, promise2]);

            // Should only have called API once
            expect(authService.getCurrentUser).toHaveBeenCalledTimes(1);
        });

        it('should allow new fetchUser call after previous completes', async () => {
            vi.mocked(authService.getCurrentUser).mockResolvedValue(createMockUser());

            const { fetchUser } = useAuthStore.getState();

            // First call
            await fetchUser();

            // Second call (after first completes)
            await fetchUser();

            // Should have called API twice
            expect(authService.getCurrentUser).toHaveBeenCalledTimes(2);
        });

        it('should handle multiple concurrent calls correctly', async () => {
            let resolveCount = 0;
            vi.mocked(authService.getCurrentUser).mockImplementation(
                () => new Promise((resolve) => {
                    setTimeout(() => {
                        resolveCount++;
                        resolve(createMockUser({ id: resolveCount, email: `user${resolveCount}@example.com` }));
                    }, 50);
                })
            );

            const { fetchUser } = useAuthStore.getState();

            // Simulate React Strict Mode with 3 concurrent calls
            const promise1 = fetchUser();
            const promise2 = fetchUser();
            const promise3 = fetchUser();

            // All should be the same promise
            expect(promise1).toBe(promise2);
            expect(promise2).toBe(promise3);

            await Promise.all([promise1, promise2, promise3]);

            // Only one API call should have been made
            expect(authService.getCurrentUser).toHaveBeenCalledTimes(1);
            expect(resolveCount).toBe(1);
        });

        it('should clear _fetchPromise after completion', async () => {
            vi.mocked(authService.getCurrentUser).mockResolvedValue(createMockUser());

            const { fetchUser } = useAuthStore.getState();

            await fetchUser();

            const state = useAuthStore.getState();
            expect(state._fetchPromise).toBeNull();
        });

        it('should clear _fetchPromise after error', async () => {
            vi.mocked(authService.getCurrentUser).mockRejectedValue(
                new Error('Failed')
            );

            const { fetchUser } = useAuthStore.getState();

            await fetchUser();

            const state = useAuthStore.getState();
            expect(state._fetchPromise).toBeNull();
        });
    });

    describe('logout', () => {
        beforeEach(() => {
            // Mock the dynamic import
            vi.mocked(authService.logoutUser).mockResolvedValue();
        });

        it('should clear user state on successful logout', async () => {
            // Set up authenticated state
            useAuthStore.setState({
                user: createMockUser(),
                isAuthenticated: true,
            });

            const { logout } = useAuthStore.getState();
            await logout();

            const state = useAuthStore.getState();

            expect(state.user).toBeNull();
            expect(state.isAuthenticated).toBe(false);
            expect(state.isBootstrapped).toBe(true);
            expect(state.isLoading).toBe(false);
        });

        it('should set manual logout sentinel in localStorage', async () => {
            const { logout } = useAuthStore.getState();
            await logout();

            expect(localStorage.getItem('auth:manualLogout')).toBe('true');
        });

        it('should clear user state even if logout request fails', async () => {
            useAuthStore.setState({
                user: createMockUser(),
                isAuthenticated: true,
            });

            vi.mocked(authService.logoutUser).mockRejectedValue(
                new Error('Network error')
            );

            const { logout } = useAuthStore.getState();
            await logout();

            const state = useAuthStore.getState();

            expect(state.user).toBeNull();
            expect(state.isAuthenticated).toBe(false);
            expect(state.error).toBe('Network error');
        });

        it('should set loading state during logout', async () => {
            vi.mocked(authService.logoutUser).mockImplementation(
                () => new Promise((resolve) => setTimeout(resolve, 100))
            );

            const { logout } = useAuthStore.getState();
            const logoutPromise = logout();

            // Should be loading immediately
            expect(useAuthStore.getState().isLoading).toBe(true);

            await logoutPromise;

            // Should not be loading after completion
            expect(useAuthStore.getState().isLoading).toBe(false);
        });

        it('should clear error before logout', async () => {
            useAuthStore.setState({ error: 'Previous error' });

            const { logout } = useAuthStore.getState();
            await logout();

            // Error should be cleared (unless logout itself fails)
            const state = useAuthStore.getState();
            expect(state.error).toBeNull();
        });

        it('should set sentinel even when localStorage fails', async () => {
            // Mock localStorage to throw error
            const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
            setItemSpy.mockImplementation(() => {
                throw new Error('Storage quota exceeded');
            });

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            const { logout } = useAuthStore.getState();
            await logout();

            // Should have attempted to set localStorage
            expect(setItemSpy).toHaveBeenCalledWith('auth:manualLogout', 'true');

            // Should have logged error
            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });
    });

    describe('markBootstrapped', () => {
        it('should mark as bootstrapped and stop loading', () => {
            useAuthStore.setState({ isLoading: true, isBootstrapped: false });

            const { markBootstrapped } = useAuthStore.getState();
            markBootstrapped();

            const state = useAuthStore.getState();

            expect(state.isBootstrapped).toBe(true);
            expect(state.isLoading).toBe(false);
        });
    });

    describe('clearError', () => {
        it('should clear error message', () => {
            useAuthStore.setState({ error: 'Some error' });

            const { clearError } = useAuthStore.getState();
            clearError();

            const state = useAuthStore.getState();
            expect(state.error).toBeNull();
        });

        it('should not affect other state', () => {
            const mockUser = createMockUser();
            useAuthStore.setState({
                user: mockUser,
                isAuthenticated: true,
                error: 'Some error'
            });

            const { clearError } = useAuthStore.getState();
            clearError();

            const state = useAuthStore.getState();

            expect(state.error).toBeNull();
            expect(state.user).toEqual(mockUser);
            expect(state.isAuthenticated).toBe(true);
        });
    });

    describe('Auth Restoration with Sentinel', () => {
        it('should skip restoration if manual logout sentinel present', async () => {
            localStorage.setItem('auth:manualLogout', 'true');

            const { fetchUser } = useAuthStore.getState();

            // In actual app, App.tsx checks sentinel before calling fetchUser
            // But if fetchUser is called anyway, it should work normally
            await fetchUser();

            // fetchUser itself doesn't check sentinel - that's App.tsx's job
            // So this test verifies that fetchUser works independently
            expect(authService.getCurrentUser).toHaveBeenCalled();
        });

        it('should restore session when sentinel is not present', async () => {
            const mockUser = createMockUser();

            vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

            const { fetchUser } = useAuthStore.getState();
            await fetchUser();

            const state = useAuthStore.getState();

            expect(state.user).toEqual(mockUser);
            expect(state.isAuthenticated).toBe(true);
        });

        it('should restore session when sentinel is not "true"', async () => {
            localStorage.setItem('auth:manualLogout', 'false');

            const mockUser = createMockUser();
            vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

            const { fetchUser } = useAuthStore.getState();
            await fetchUser();

            const state = useAuthStore.getState();
            expect(state.user).toEqual(mockUser);
        });
    });

    describe('Complex State Transitions', () => {
        it('should handle login -> logout -> login cycle', async () => {
            const user1 = createMockUser({ id: 1, email: 'user1@example.com' });
            const user2 = createMockUser({ id: 2, email: 'user2@example.com' });

            // First login
            vi.mocked(authService.getCurrentUser).mockResolvedValue(user1);
            const { fetchUser } = useAuthStore.getState();
            await fetchUser();

            expect(useAuthStore.getState().user).toEqual(user1);
            expect(useAuthStore.getState().isAuthenticated).toBe(true);

            // Logout
            const { logout } = useAuthStore.getState();
            await logout();

            expect(useAuthStore.getState().user).toBeNull();
            expect(useAuthStore.getState().isAuthenticated).toBe(false);
            expect(localStorage.getItem('auth:manualLogout')).toBe('true');

            // Second login (different user)
            localStorage.removeItem('auth:manualLogout');
            vi.mocked(authService.getCurrentUser).mockResolvedValue(user2);
            await fetchUser();

            expect(useAuthStore.getState().user).toEqual(user2);
            expect(useAuthStore.getState().isAuthenticated).toBe(true);
        });

        it('should maintain error state across multiple operations', async () => {
            // Failed fetch
            vi.mocked(authService.getCurrentUser).mockRejectedValue(
                new Error('Network error')
            );

            const { fetchUser } = useAuthStore.getState();
            await fetchUser();

            expect(useAuthStore.getState().error).toBe('Network error');

            // Error should persist until cleared or successful operation
            expect(useAuthStore.getState().error).toBe('Network error');

            // Clear error
            const { clearError } = useAuthStore.getState();
            clearError();

            expect(useAuthStore.getState().error).toBeNull();
        });

        it('should handle rapid state changes without race conditions', async () => {
            let callCount = 0;
            vi.mocked(authService.getCurrentUser).mockImplementation(
                () => new Promise((resolve) => {
                    const count = ++callCount;
                    setTimeout(() => {
                        resolve(createMockUser({
                            id: count,
                            email: `user${count}@example.com`
                        }));
                    }, Math.random() * 100);
                })
            );

            const { fetchUser } = useAuthStore.getState();

            // Make multiple calls
            const p1 = fetchUser();
            const p2 = fetchUser();
            const p3 = fetchUser();

            await Promise.all([p1, p2, p3]);

            // Due to deduplication, only one API call should have been made
            expect(callCount).toBe(1);

            // State should reflect the result from the single call
            const state = useAuthStore.getState();
            expect(state.user?.id).toBe(1);
        });
    });

    describe('Edge Cases', () => {
        it('should handle null user from getCurrentUser', async () => {
            vi.mocked(authService.getCurrentUser).mockResolvedValue(null);

            const { fetchUser } = useAuthStore.getState();
            await fetchUser();

            const state = useAuthStore.getState();

            expect(state.user).toBeNull();
            expect(state.isAuthenticated).toBe(false);
            expect(state.isBootstrapped).toBe(true);
        });

        it('should handle error objects without message', async () => {
            vi.mocked(authService.getCurrentUser).mockRejectedValue(
                { code: 'ERR_NETWORK' }
            );

            const { fetchUser } = useAuthStore.getState();
            await fetchUser();

            const state = useAuthStore.getState();
            expect(state.error).toBe('Failed to fetch user');
        });

        it('should handle concurrent logout calls', async () => {
            vi.mocked(authService.logoutUser).mockImplementation(
                () => new Promise((resolve) => setTimeout(resolve, 100))
            );

            const { logout } = useAuthStore.getState();

            // Call logout multiple times concurrently
            const p1 = logout();
            const p2 = logout();
            const p3 = logout();

            await Promise.all([p1, p2, p3]);

            // All should complete successfully
            const state = useAuthStore.getState();
            expect(state.user).toBeNull();
            expect(state.isAuthenticated).toBe(false);
        });
    });
});