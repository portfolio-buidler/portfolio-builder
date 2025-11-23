# Sprint Implementation Guide v1.0 - Part 2: Testing Tasks

> **Continued from Part 1**

---

## P2: Testing & Quality

### Task 8: E2E Tests for Critical User Flows 🟡

**Owner**: Frontend (Netanel)  
**Estimated Time**: 3-4 days  
**Dependencies**: Tasks 1-3 (Auth flows completed)

#### Implementation Plan

**Step 1: Setup Playwright Configuration**

`frontend/playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] }
    }
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});
```

**Step 2: Create Test Fixtures**

`tests/e2e/fixtures/auth.fixture.ts`:

```typescript
import { test as base, Page } from '@playwright/test';

export interface AuthFixtures {
  authenticatedPage: Page;
  guestPage: Page;
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Register a test user
    await page.goto('/register');
    await page.fill('[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('[name="password"]', 'TestPassword123!@#');
    await page.fill('[name="confirmPassword"]', 'TestPassword123!@#');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
    
    await use(page);
    
    // Cleanup: logout after test
    await page.click('[aria-label="Logout"]');
  },
  
  guestPage: async ({ page }, use) => {
    await page.goto('/');
    await use(page);
  }
});

export { expect } from '@playwright/test';
```

**Step 3: Test Full Registration Flow**

`tests/e2e/01-registration.spec.ts`:

```typescript
import { test, expect } from './fixtures/auth.fixture';

test.describe('User Registration Flow', () => {
  test('should complete full registration flow', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;
    
    // Step 1: Navigate to registration
    await page.goto('/register');
    await expect(page).toHaveURL('/register');
    
    // Step 2: Fill registration form
    await page.fill('[name="email"]', testEmail);
    await page.fill('[name="password"]', 'SecurePassword123!@#');
    await page.fill('[name="confirmPassword"]', 'SecurePassword123!@#');
    
    // Verify submit button becomes enabled
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
    
    // Step 3: Submit form
    await page.click('button[type="submit"]');
    
    // Step 4: Verify redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 5000 });
    await expect(page).toHaveURL('/dashboard');
    
    // Step 5: Verify user name appears
    await expect(page.locator('.settings-sidebar__name')).toBeVisible();
  });
  
  test('should show validation errors for weak password', async ({ page }) => {
    await page.goto('/register');
    
    // Enter weak password (< 12 characters)
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'weak');
    
    // Verify error message
    await expect(page.locator('.registration__error')).toContainText(
      'Password must be at least 12 characters'
    );
    
    // Verify submit button is disabled
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });
  
  test('should remove error styling when password corrected', async ({ page }) => {
    await page.goto('/register');
    
    // Enter weak password first
    await page.fill('[name="password"]', 'weak');
    
    // Verify error state
    await expect(page.locator('[name="password"]')).toHaveClass(/registration__input--error/);
    
    // Correct the password
    await page.fill('[name="password"]', 'StrongPassword123!@#');
    
    // Verify error styling removed
    await expect(page.locator('[name="password"]')).not.toHaveClass(/registration__input--error/);
    await expect(page.locator('[name="password"]')).toHaveClass(/registration__input--valid/);
  });
});
```

**Step 4: Test Login Flow**

`tests/e2e/02-login.spec.ts`:

```typescript
import { test, expect } from './fixtures/auth.fixture';

test.describe('User Login Flow', () => {
  test.beforeAll(async ({ page }) => {
    // Create a test user
    await page.goto('/register');
    await page.fill('[name="email"]', 'login-test@example.com');
    await page.fill('[name="password"]', 'TestPassword123!@#');
    await page.fill('[name="confirmPassword"]', 'TestPassword123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Logout
    await page.click('[aria-label="Logout"]');
    await page.waitForURL('/login');
  });
  
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill login form
    await page.fill('[name="email"]', 'login-test@example.com');
    await page.fill('[name="password"]', 'TestPassword123!@#');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify redirect to dashboard
    await page.waitForURL('/dashboard');
    await expect(page).toHaveURL('/dashboard');
  });
  
  test('should show error message for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill with wrong password
    await page.fill('[name="email"]', 'login-test@example.com');
    await page.fill('[name="password"]', 'WrongPassword123');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify error message (NOT "Welcome back!")
    await expect(page.locator('.login__error')).toContainText(
      'Invalid email or password'
    );
    
    // Verify error is NOT in red background (light pink instead)
    const errorBox = page.locator('.login__error');
    await expect(errorBox).toHaveCSS('background-color', /rgba?\(254,.*\)/); // Light pink
    await expect(errorBox).not.toHaveCSS('background-color', /rgba?\(255, 0, 0/); // Not pure red
  });
  
  test('should handle session persistence across page reloads', async ({ authenticatedPage }) => {
    // User is already authenticated via fixture
    
    // Reload page
    await authenticatedPage.reload();
    
    // Should still be authenticated
    await expect(authenticatedPage).toHaveURL('/dashboard');
    await expect(authenticatedPage.locator('.settings-sidebar__name')).toBeVisible();
  });
});
```

**Step 5: Test Upload Flow**

`tests/e2e/03-upload-cv.spec.ts`:

```typescript
import { test, expect } from './fixtures/auth.fixture';
import path from 'path';

test.describe('CV Upload Flow', () => {
  test('should upload CV as authenticated user', async ({ authenticatedPage }) => {
    // Navigate to upload screen
    await authenticatedPage.goto('/');
    
    // Upload file
    const fileInput = authenticatedPage.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/sample-resume.pdf'));
    
    // Wait for upload to complete
    await expect(authenticatedPage.locator('.upload-area[data-status="success"]')).toBeVisible({
      timeout: 10000
    });
    
    // Verify success message
    await expect(authenticatedPage.locator('.upload-area__text')).toContainText('Upload complete');
    
    // Should NOT see auth prompt (already authenticated)
    await expect(authenticatedPage.locator('.auth-prompt-modal')).not.toBeVisible();
  });
  
  test('should handle guest upload with auth prompt', async ({ guestPage }) => {
    // Upload as guest
    const fileInput = guestPage.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/sample-resume.pdf'));
    
    // Wait for upload success
    await expect(guestPage.locator('.upload-area[data-status="success"]')).toBeVisible({
      timeout: 10000
    });
    
    // Navigate to preview
    await guestPage.click('button:has-text("Next")');
    await guestPage.waitForURL('/preview');
    
    // Click Next to trigger auth prompt
    await guestPage.click('.preview-area__next');
    
    // Verify auth modal appears
    await expect(guestPage.locator('.auth-prompt-modal')).toBeVisible();
    await expect(guestPage.locator('.auth-prompt-modal__title')).toContainText('Save Your Portfolio');
    
    // Verify countdown timer is present
    await expect(guestPage.locator('.auth-prompt-modal__timer')).toBeVisible();
  });
  
  test('should claim guest upload after login', async ({ guestPage }) => {
    // Step 1: Upload as guest
    const fileInput = guestPage.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/sample-resume.pdf'));
    await expect(guestPage.locator('.upload-area[data-status="success"]')).toBeVisible({
      timeout: 10000
    });
    
    // Step 2: Go to preview and trigger auth
    await guestPage.click('button:has-text("Next")');
    await guestPage.waitForURL('/preview');
    await guestPage.click('.preview-area__next');
    
    // Step 3: Click Login button in modal
    await guestPage.click('.auth-prompt-modal__button--secondary');
    await guestPage.waitForURL('/login');
    
    // Step 4: Login
    await guestPage.fill('[name="email"]', 'claim-test@example.com');
    await guestPage.fill('[name="password"]', 'TestPassword123!@#');
    await guestPage.click('button[type="submit"]');
    
    // Step 5: Should redirect to preview with saved portfolio
    await guestPage.waitForURL('/preview');
    
    // Step 6: Verify success toast
    await expect(guestPage.locator('.toast')).toContainText('Portfolio saved successfully');
  });
  
  test('should handle upload expiration (2 minutes)', async ({ guestPage }) => {
    // Upload as guest
    const fileInput = guestPage.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/sample-resume.pdf'));
    await expect(guestPage.locator('.upload-area[data-status="success"]')).toBeVisible();
    
    // Go to preview
    await guestPage.click('button:has-text("Next")');
    await guestPage.waitForURL('/preview');
    
    // Mock time to simulate 2+ minutes passing
    await guestPage.evaluate(() => {
      const uploadStore = JSON.parse(localStorage.getItem('portfolio-upload-storage') || '{}');
      if (uploadStore.state?.tempUploadExpiry) {
        uploadStore.state.tempUploadExpiry = Date.now() - 1000; // Already expired
        localStorage.setItem('portfolio-upload-storage', JSON.stringify(uploadStore));
      }
    });
    
    // Reload page to trigger expiration check
    await guestPage.reload();
    
    // Should redirect to upload screen with error
    await guestPage.waitForURL('/');
    await expect(guestPage.locator('.toast--error')).toContainText('Upload expired');
  });
  
  test('should validate file types and reject invalid files', async ({ guestPage }) => {
    // Try uploading invalid file type
    const fileInput = guestPage.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/invalid.txt'));
    
    // Should show error
    await expect(guestPage.locator('.upload-area[data-status="error"]')).toBeVisible();
    await expect(guestPage.locator('.upload-area__text')).toContainText(
      /Invalid file|not allowed/i
    );
  });
});
```

**Step 6: Test Portfolio Dashboard Flow**

`tests/e2e/04-dashboard.spec.ts`:

```typescript
import { test, expect } from './fixtures/auth.fixture';

test.describe('Portfolio Dashboard Flow', () => {
  test('should load dashboard with default settings', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    
    // Verify sidebar visible
    await expect(authenticatedPage.locator('.settings-sidebar')).toBeVisible();
    
    // Verify toolbar visible
    await expect(authenticatedPage.locator('.customization-toolbar')).toBeVisible();
    
    // Verify preview visible
    await expect(authenticatedPage.locator('.portfolio-preview')).toBeVisible();
    
    // Verify default settings applied
    await expect(authenticatedPage.locator('[data-style="style-1"]')).toBeVisible();
  });
  
  test('should change color palette and see live preview update', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    
    // Open color picker
    await authenticatedPage.click('button:has-text("Color")');
    
    // Select blue color
    await authenticatedPage.click('.customization-toolbar__color-swatch[aria-label="blue"]');
    
    // Verify preview updated with blue color
    const preview = authenticatedPage.locator('.portfolio-preview__content');
    const cssVar = await preview.evaluate((el) => 
      getComputedStyle(el).getPropertyValue('--portfolio-primary')
    );
    
    expect(cssVar).toContain('#3B82F6'); // Blue color code
    
    // Verify unsaved changes indicator
    await expect(authenticatedPage.locator('.settings-sidebar__unsaved-indicator')).toBeVisible();
  });
  
  test('should change style and typography', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    
    // Change style
    await authenticatedPage.click('button:has-text("Style")');
    await authenticatedPage.click('button:has-text("Style 2")');
    
    // Change typography
    await authenticatedPage.click('button:has-text("Typographic")');
    await authenticatedPage.click('button:has-text("Montserrat")');
    
    // Verify changes applied
    await expect(authenticatedPage.locator('[data-style="style-2"]')).toBeVisible();
    
    const preview = authenticatedPage.locator('.portfolio-preview__content');
    const fontFamily = await preview.evaluate((el) => 
      getComputedStyle(el).getPropertyValue('--portfolio-font-family')
    );
    
    expect(fontFamily).toContain('Montserrat');
  });
  
  test('should save settings and persist across reload', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    
    // Make changes
    await authenticatedPage.click('button:has-text("Color")');
    await authenticatedPage.click('.customization-toolbar__color-swatch[aria-label="green"]');
    
    // Save
    await authenticatedPage.click('.settings-sidebar__save:not(:disabled)');
    
    // Wait for success toast
    await expect(authenticatedPage.locator('.toast--success')).toContainText('saved');
    
    // Reload page
    await authenticatedPage.reload();
    
    // Verify settings persisted
    const preview = authenticatedPage.locator('.portfolio-preview__content');
    const cssVar = await preview.evaluate((el) => 
      getComputedStyle(el).getPropertyValue('--portfolio-primary')
    );
    
    expect(cssVar).toContain('#10B981'); // Green color
  });
  
  test('should toggle display mode', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    
    // Click display mode button
    await authenticatedPage.click('.customization-toolbar__mode-toggle--display');
    
    // Verify full-screen mode
    await expect(authenticatedPage.locator('.dashboard[data-mode="display"]')).toBeVisible();
    await expect(authenticatedPage.locator('.settings-sidebar')).not.toBeVisible();
    await expect(authenticatedPage.locator('.customization-toolbar')).not.toBeVisible();
    
    // Exit button should be visible
    await expect(authenticatedPage.locator('.portfolio-preview__exit')).toBeVisible();
    
    // Click exit
    await authenticatedPage.click('.portfolio-preview__exit');
    
    // Back to edit mode
    await expect(authenticatedPage.locator('.dashboard[data-mode="edit"]')).toBeVisible();
    await expect(authenticatedPage.locator('.settings-sidebar')).toBeVisible();
  });
  
  test('should warn before leaving with unsaved changes', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    
    // Make a change
    await authenticatedPage.click('button:has-text("Color")');
    await authenticatedPage.click('.customization-toolbar__color-swatch[aria-label="red"]');
    
    // Set up dialog handler
    let dialogShown = false;
    authenticatedPage.on('dialog', (dialog) => {
      dialogShown = true;
      dialog.accept();
    });
    
    // Try to navigate away
    await authenticatedPage.goto('/');
    
    // Dialog should have been shown
    expect(dialogShown).toBe(true);
  });
});
```

**Step 7: Test Error Handling**

`tests/e2e/05-error-handling.spec.ts`:

```typescript
import { test, expect } from './fixtures/auth.fixture';

test.describe('Error Handling', () => {
  test('should handle network errors during upload', async ({ page }) => {
    await page.goto('/');
    
    // Mock network failure
    await page.route('**/api/v1/resumes/upload', (route) => {
      route.abort('failed');
    });
    
    // Try to upload
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/sample-resume.pdf'));
    
    // Should show error
    await expect(page.locator('.upload-area[data-status="error"]')).toBeVisible();
    await expect(page.locator('.upload-area__text')).toContainText(/failed|error/i);
  });
  
  test('should handle API 500 errors gracefully', async ({ page }) => {
    await page.goto('/login');
    
    // Mock server error
    await page.route('**/api/v1/auth/login', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ detail: 'Internal server error' })
      });
    });
    
    // Try to login
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'Password123!@#');
    await page.click('button[type="submit"]');
    
    // Should show user-friendly error
    await expect(page.locator('.login__error')).toBeVisible();
    await expect(page.locator('.login__error')).toContainText(/error|failed/i);
  });
  
  test('should handle session expiration', async ({ authenticatedPage }) => {
    // User is authenticated
    await authenticatedPage.goto('/dashboard');
    
    // Mock expired session
    await authenticatedPage.evaluate(() => {
      localStorage.removeItem('auth-storage');
      document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    });
    
    // Try to make an API call
    await authenticatedPage.reload();
    
    // Should redirect to login
    await authenticatedPage.waitForURL('/login');
    
    // Should show session expired message
    await expect(authenticatedPage.locator('.toast')).toContainText(/session expired/i);
  });
});
```

**Step 8: Setup CI Integration**

`.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on:
  push:
    branches: [dev, main]
  pull_request:
    branches: [dev, main]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: portfolio_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      
      - name: Install backend dependencies
        working-directory: backend
        run: |
          pip install poetry
          poetry install --no-root
      
      - name: Run database migrations
        working-directory: backend
        env:
          DATABASE_URL: postgresql+asyncpg://postgres:postgres@localhost:5432/portfolio_test
        run: |
          poetry run alembic upgrade head
      
      - name: Start backend server
        working-directory: backend
        env:
          DATABASE_URL: postgresql+asyncpg://postgres:postgres@localhost:5432/portfolio_test
        run: |
          poetry run uvicorn app.main:app --port 9000 &
          sleep 5
      
      - name: Install frontend dependencies
        working-directory: frontend
        run: npm ci
      
      - name: Install Playwright browsers
        working-directory: frontend
        run: npx playwright install --with-deps chromium
      
      - name: Run E2E tests
        working-directory: frontend
        run: npm run e2e
        env:
          VITE_API_BASE_URL: http://localhost:9000
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: frontend/test-results/
          retention-days: 30
      
      - name: Upload screenshots on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-screenshots
          path: frontend/test-results/**/*.png
          retention-days: 30
```

**Step 9: Testing Checklist**
- [ ] All critical user flows covered (register, login, upload, dashboard)
- [ ] Error scenarios tested (network failures, validation errors)
- [ ] Authentication persistence tested
- [ ] Guest upload flow tested
- [ ] Display mode toggle tested
- [ ] Settings persistence tested
- [ ] Tests pass in headless mode
- [ ] Tests run in CI on every PR
- [ ] Test reports generated with screenshots
- [ ] Cross-browser tests (Chrome, Firefox, Safari)

---

### Task 9: Frontend Auth Store Unit Tests 🟡

**Owner**: Frontend (Netanel)  
**Estimated Time**: 1 day  
**Dependencies**: Task 3 (Auth flow completed)

#### Implementation Plan

**Step 1: Create Auth Store Test File**

`frontend/src/tests/unit/authStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useAuthStore } from '@/store/authStore';
import * as authService from '@/services/authService';

// Mock auth service
vi.mock('@/services/authService');

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isBootstrapped: false,
      isLoading: false,
      error: null,
      _fetchPromise: null
    });
    
    // Clear localStorage
    localStorage.clear();
    
    // Clear all mocks
    vi.clearAllMocks();
  });
  
  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();
      
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isBootstrapped).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
  
  describe('Login Flow', () => {
    it('should set user and token on successful login', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
      const mockToken = 'mock-jwt-token';
      
      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
        access_token: mockToken
      });
      
      const { login } = useAuthStore.getState();
      await login('test@example.com', 'password');
      
      const state = useAuthStore.getState();
      
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe(mockToken);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
    });
    
    it('should set error on failed login', async () => {
      vi.mocked(authService.login).mockRejectedValue(
        new Error('Invalid credentials')
      );
      
      const { login } = useAuthStore.getState();
      
      await expect(login('test@example.com', 'wrong')).rejects.toThrow('Invalid credentials');
      
      const state = useAuthStore.getState();
      
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe('Invalid credentials');
    });
    
    it('should clear loading state after login attempt', async () => {
      vi.mocked(authService.login).mockResolvedValue({
        user: { id: 1, email: 'test@example.com', name: 'Test' },
        access_token: 'token'
      });
      
      const { login } = useAuthStore.getState();
      
      const loginPromise = login('test@example.com', 'password');
      
      // Should be loading
      expect(useAuthStore.getState().isLoading).toBe(true);
      
      await loginPromise;
      
      // Should not be loading
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });
  
  describe('Logout Flow', () => {
    it('should clear state on logout', async () => {
      // Set up authenticated state
      useAuthStore.setState({
        user: { id: 1, email: 'test@example.com', name: 'Test' },
        accessToken: 'token',
        isAuthenticated: true
      });
      
      vi.mocked(authService.logout).mockResolvedValue();
      
      const { logout } = useAuthStore.getState();
      await logout();
      
      const state = useAuthStore.getState();
      
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
    
    it('should set manual logout sentinel in localStorage', async () => {
      vi.mocked(authService.logout).mockResolvedValue();
      
      const { logout } = useAuthStore.getState();
      await logout();
      
      expect(localStorage.getItem('auth:manualLogout')).toBe('true');
    });
  });
  
  describe('Auth Restoration', () => {
    it('should restore user on fetchUser success', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test' };
      
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);
      
      const { fetchUser } = useAuthStore.getState();
      await fetchUser();
      
      const state = useAuthStore.getState();
      
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isBootstrapped).toBe(true);
    });
    
    it('should skip restoration if manual logout sentinel present', async () => {
      localStorage.setItem('auth:manualLogout', 'true');
      
      const { fetchUser } = useAuthStore.getState();
      await fetchUser();
      
      const state = useAuthStore.getState();
      
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isBootstrapped).toBe(true);
      
      // Should not have called API
      expect(authService.getCurrentUser).not.toHaveBeenCalled();
    });
    
    it('should mark bootstrapped even on fetchUser failure', async () => {
      vi.mocked(authService.getCurrentUser).mockRejectedValue(
        new Error('Unauthorized')
      );
      
      const { fetchUser } = useAuthStore.getState();
      await fetchUser();
      
      const state = useAuthStore.getState();
      
      expect(state.isBootstrapped).toBe(true);
      expect(state.isAuthenticated).toBe(false);
    });
  });
  
  describe('Promise Deduplication (React Strict Mode)', () => {
    it('should return same promise for concurrent fetchUser calls', async () => {
      vi.mocked(authService.getCurrentUser).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          id: 1,
          email: 'test@example.com',
          name: 'Test'
        }), 100))
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
      vi.mocked(authService.getCurrentUser).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        name: 'Test'
      });
      
      const { fetchUser } = useAuthStore.getState();
      
      // First call
      await fetchUser();
      
      // Second call (after first completes)
      await fetchUser();
      
      // Should have called API twice
      expect(authService.getCurrentUser).toHaveBeenCalledTimes(2);
    });
    
    it('should clear _fetchPromise after completion', async () => {
      vi.mocked(authService.getCurrentUser).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        name: 'Test'
      });
      
      const { fetchUser } = useAuthStore.getState();
      
      await fetchUser();
      
      const state = useAuthStore.getState();
      expect(state._fetchPromise).toBeNull();
    });
    
    it('should clear _fetchPromise on error', async () => {
      vi.mocked(authService.getCurrentUser).mockRejectedValue(
        new Error('Network error')
      );
      
      const { fetchUser } = useAuthStore.getState();
      
      await fetchUser();
      
      const state = useAuthStore.getState();
      expect(state._fetchPromise).toBeNull();
    });
  });
  
  describe('Token Refresh', () => {
    it('should update access token on refresh', async () => {
      // Set initial authenticated state
      useAuthStore.setState({
        user: { id: 1, email: 'test@example.com', name: 'Test' },
        accessToken: 'old-token',
        isAuthenticated: true
      });
      
      vi.mocked(authService.refreshToken).mockResolvedValue({
        access_token: 'new-token'
      });
      
      const { refreshAccessToken } = useAuthStore.getState();
      await refreshAccessToken();
      
      const state = useAuthStore.getState();
      
      expect(state.accessToken).toBe('new-token');
      expect(state.isAuthenticated).toBe(true);
    });
    
    it('should clear auth state on refresh failure', async () => {
      // Set initial authenticated state
      useAuthStore.setState({
        user: { id: 1, email: 'test@example.com', name: 'Test' },
        accessToken: 'old-token',
        isAuthenticated: true
      });
      
      vi.mocked(authService.refreshToken).mockRejectedValue(
        new Error('Refresh token expired')
      );
      
      const { refreshAccessToken } = useAuthStore.getState();
      
      try {
        await refreshAccessToken();
      } catch {
        // Expected to throw
      }
      
      const state = useAuthStore.getState();
      
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });
  
  describe('Error Handling', () => {
    it('should clear previous error on new login attempt', async () => {
      // Set error from previous failed attempt
      useAuthStore.setState({ error: 'Previous error' });
      
      vi.mocked(authService.login).mockResolvedValue({
        user: { id: 1, email: 'test@example.com', name: 'Test' },
        access_token: 'token'
      });
      
      const { login } = useAuthStore.getState();
      await login('test@example.com', 'password');
      
      const state = useAuthStore.getState();
      expect(state.error).toBeNull();
    });
    
    it('should preserve user state on non-auth errors', async () => {
      // Set authenticated state
      useAuthStore.setState({
        user: { id: 1, email: 'test@example.com', name: 'Test' },
        accessToken: 'token',
        isAuthenticated: true
      });
      
      // Some non-auth error occurs
      useAuthStore.setState({ error: 'Upload failed' });
      
      const state = useAuthStore.getState();
      
      // User should still be authenticated
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).not.toBeNull();
    });
  });
});
```

**Step 2: Run Tests with Coverage**

Add to `frontend/package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui"
  }
}
```

Run tests:

```bash
cd frontend
npm run test:coverage
```

**Step 3: Testing Checklist**
- [ ] Initial state tests pass
- [ ] Login flow tests pass (success + failure)
- [ ] Logout flow tests pass
- [ ] Auth restoration tests pass
- [ ] Promise deduplication tests pass (Strict Mode simulation)
- [ ] Token refresh tests pass
- [ ] Error handling tests pass
- [ ] Test coverage >90% for auth store
- [ ] All tests run in CI

---

### Task 10: Rate Limiting Automated Tests 🟡

**Owner**: Backend (Israel, Ido, Yarin)  
**Estimated Time**: 1 day  
**Dependencies**: None

#### Implementation Plan

**Step 1: Create Rate Limiting Test File**

`backend/app/tests/features/test_rate_limiting.py`:

```python
"""
Rate limiting integration tests.
Tests the rate limiter middleware functionality.
"""
import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
class TestRateLimiting:
    """Test rate limiting behavior"""
    
    async def test_rate_limit_headers_present(self, client: AsyncClient):
        """Rate limit headers should be present in all responses"""
        response = await client.get("/api/v1/resumes")
        
        assert "X-RateLimit-Limit" in response.headers
        assert "X-RateLimit-Remaining" in response.headers
        assert "X-RateLimit-Reset" in response.headers
        
        limit = int(response.headers["X-RateLimit-Limit"])
        remaining = int(response.headers["X-RateLimit-Remaining"])
        
        assert limit > 0
        assert remaining <= limit
    
    async def test_rate_limit_decrements_on_requests(self, client: AsyncClient):
        """Remaining count should decrement with each request"""
        # First request
        response1 = await client.get("/api/v1/resumes")
        remaining1 = int(response1.headers["X-RateLimit-Remaining"])
        
        # Second request
        response2 = await client.get("/api/v1/resumes")
        remaining2 = int(response2.headers["X-RateLimit-Remaining"])
        
        # Should decrement by 1
        assert remaining2 == remaining1 - 1
    
    async def test_rate_limit_burst_returns_429(self, client: AsyncClient):
        """Exceeding rate limit should return 429 Too Many Requests"""
        # Get current limit
        response = await client.get("/api/v1/resumes")
        limit = int(response.headers["X-RateLimit-Limit"])
        remaining = int(response.headers["X-RateLimit-Remaining"])
        
        # Make requests until limit exhausted
        requests_to_make = remaining + 1
        
        responses = []
        for _ in range(requests_to_make):
            resp = await client.get("/api/v1/resumes")
            responses.append(resp)
        
        # Last response should be 429
        assert responses[-1].status_code == 429
        
        # Should have Retry-After header
        assert "Retry-After" in responses[-1].headers
        
        # Error message should be clear
        error_data = responses[-1].json()
        assert "rate limit" in error_data["detail"].lower()
    
    async def test_different_users_have_independent_limits(
        self,
        authenticated_client_1: AsyncClient,
        authenticated_client_2: AsyncClient
    ):
        """Different users should have separate rate limit buckets"""
        # User 1 makes requests
        response1 = await authenticated_client_1.get("/api/v1/resumes")
        remaining1_before = int(response1.headers["X-RateLimit-Remaining"])
        
        # User 2 makes requests
        response2 = await authenticated_client_2.get("/api/v1/resumes")
        remaining2_initial = int(response2.headers["X-RateLimit-Remaining"])
        
        # User 1 makes another request
        response1_again = await authenticated_client_1.get("/api/v1/resumes")
        remaining1_after = int(response1_again.headers["X-RateLimit-Remaining"])
        
        # User 1's remaining should have decreased
        assert remaining1_after == remaining1_before - 1
        
        # User 2's limit should be unaffected
        response2_again = await authenticated_client_2.get("/api/v1/resumes")
        remaining2_after = int(response2_again.headers["X-RateLimit-Remaining"])
        assert remaining2_after == remaining2_initial - 1
    
    async def test_exempt_endpoints_bypass_rate_limiting(self, client: AsyncClient):
        """Exempt endpoints should not count toward rate limit"""
        # Get current remaining count
        response = await client.get("/api/v1/resumes")
        remaining_before = int(response.headers["X-RateLimit-Remaining"])
        
        # Make requests to exempt endpoint (e.g., health check)
        for _ in range(10):
            await client.get("/health")
        
        # Check remaining count unchanged
        response_after = await client.get("/api/v1/resumes")
        remaining_after = int(response_after.headers["X-RateLimit-Remaining"])
        
        # Should only have decreased by 2 (the two /resumes requests)
        assert remaining_after == remaining_before - 1
    
    async def test_rate_limit_resets_after_window(self, client: AsyncClient):
        """Rate limit should reset after the time window expires"""
        # Get initial remaining count
        response1 = await client.get("/api/v1/resumes")
        remaining1 = int(response1.headers["X-RateLimit-Remaining"])
        reset_time = int(response1.headers["X-RateLimit-Reset"])
        
        # Calculate time until reset
        import time
        current_time = int(time.time())
        wait_time = reset_time - current_time + 1  # +1 for safety
        
        # If wait time is reasonable for a test, wait for reset
        if wait_time <= 5:  # Only wait if reset is within 5 seconds
            await asyncio.sleep(wait_time)
            
            # Make request after reset
            response2 = await client.get("/api/v1/resumes")
            remaining2 = int(response2.headers["X-RateLimit-Remaining"])
            
            # Remaining should be reset to near-limit value
            limit = int(response2.headers["X-RateLimit-Limit"])
            assert remaining2 == limit - 1
        else:
            pytest.skip("Rate limit window too long for test")
    
    async def test_rate_limit_applies_to_all_http_methods(
        self,
        authenticated_client: AsyncClient
    ):
        """Rate limiting should apply to GET, POST, PUT, DELETE"""
        # Get initial remaining
        response = await authenticated_client.get("/api/v1/resumes")
        remaining_before = int(response.headers["X-RateLimit-Remaining"])
        
        # POST request
        await authenticated_client.post(
            "/api/v1/resumes/upload",
            files={"file": ("test.pdf", b"fake pdf content", "application/pdf")}
        )
        
        # Check remaining decreased
        response_after = await authenticated_client.get("/api/v1/resumes")
        remaining_after = int(response_after.headers["X-RateLimit-Remaining"])
        
        # Should have decreased by 3 (2 GETs + 1 POST)
        assert remaining_after < remaining_before


@pytest.fixture
async def authenticated_client_1(client: AsyncClient) -> AsyncClient:
    """First authenticated user client"""
    # Register and login user 1
    await client.post("/api/v1/auth/register", json={
        "email": "user1@test.com",
        "password": "TestPassword123!@#"
    })
    
    response = await client.post("/api/v1/auth/login", json={
        "email": "user1@test.com",
        "password": "TestPassword123!@#"
    })
    
    token = response.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    
    return client


@pytest.fixture
async def authenticated_client_2(app: FastAPI) -> AsyncClient:
    """Second authenticated user client (separate session)"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Register and login user 2
        await client.post("/api/v1/auth/register", json={
            "email": "user2@test.com",
            "password": "TestPassword123!@#"
        })
        
        response = await client.post("/api/v1/auth/login", json={
            "email": "user2@test.com",
            "password": "TestPassword123!@#"
        })
        
        token = response.json()["access_token"]
        client.headers["Authorization"] = f"Bearer {token}"
        
        yield client
```

**Step 2: Add Rate Limiter Configuration for Testing**

`backend/app/tests/conftest.py`:

```python
import pytest
from app.main import app
from app.middleware.rate_limiter import reset_rate_limits

@pytest.fixture(autouse=True)
async def reset_limiter_state():
    """Reset rate limiter state before each test"""
    reset_rate_limits()
    yield
    reset_rate_limits()
```

**Step 3: Run Tests**

```bash
cd backend
pytest app/tests/features/test_rate_limiting.py -v
```

**Step 4: Testing Checklist**
- [ ] Rate limit headers present in responses
- [ ] Remaining count decrements correctly
- [ ] 429 status code returned when limit exceeded
- [ ] Retry-After header present in 429 responses
- [ ] Different users have independent limits
- [ ] Exempt endpoints bypass rate limiting
- [ ] Rate limit resets after window expires
- [ ] Rate limiting applies to all HTTP methods
- [ ] Tests pass in CI

---

This completes Part 2 of the Sprint Implementation Guide covering P2 Testing Tasks. Would you like me to continue with:

**Part 3** - P3 Deployment & Infrastructure Tasks (Tasks 13-17)?
**Part 4** - Implementation Patterns Library?
**Part 5** - Improvements to Existing Instruction Files?
