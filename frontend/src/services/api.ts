import axios from 'axios';

let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000';

// Normalize: remove trailing '/api/v1' if someone included it in the env
if (API_BASE_URL.endsWith('/api/v1')) {
  API_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/, '')
}
// Also remove trailing slash
if (API_BASE_URL.endsWith('/')) {
  API_BASE_URL = API_BASE_URL.slice(0, -1)
}

/**
 * Central Axios instance with automatic token management and refresh logic.
 * 
 * Features:
 * - Automatic access token injection in Authorization header
 * - HttpOnly refresh token cookies (handled by browser)
 * - Automatic token refresh on 401 responses
 * - Redirect to login on refresh failure
 */

// In-memory access token storage
let accessToken: string | null = null;

/**
 * Set the access token for subsequent requests
 */
export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

/**
 * Get the current access token
 */
export const getAccessToken = (): string | null => {
  return accessToken;
};

/**
 * Clear the access token (on logout)
 */
export const clearAccessToken = (): void => {
  accessToken = null;
};

// Create main API instance
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  withCredentials: true, // Critical: allows cookies (refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor: Inject access token into Authorization header
 */
api.interceptors.request.use(
  (config: any) => {
    // Normalize config.url to avoid double '/api/v1' in requests.
    if (config && config.url && typeof config.url === 'string') {
      // Replace '/api/v1/api/v1' => '/api/v1'
      config.url = config.url.replace(/\/api\/v1\/api\/v1/g, '/api/v1');

      // Remove leading '/api/v1' so baseURL doesn't duplicate it
      if (config.url.startsWith('/api/v1/')) {
        config.url = config.url.replace(/^\/api\/v1\//, '');
      } else if (config.url === '/api/v1') {
        config.url = '';
      }
    }

    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor: Handle 401 errors and auto-refresh tokens
 */
api.interceptors.response.use(
  (response: any) => response,
  async (error: any) => {
    const originalRequest = error.config;

    // Check if error is 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the access token
        const { data } = await axios.post(
          `${API_BASE_URL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true } // Send HttpOnly refresh token cookie
        );

        // Update the access token
        setAccessToken(data.access_token);

        // Retry the original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        }
        
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear token and redirect to login
        clearAccessToken();
        
        // Only redirect if not already on login/register pages
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Helper to check if user is authenticated (has access token)
 */
export const isAuthenticated = (): boolean => {
  return accessToken !== null;
};
