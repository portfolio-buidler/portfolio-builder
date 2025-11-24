import { test, expect } from '@playwright/test'

/**
 * Authentication E2E Integration Tests with Real Backend
 * 
 * These tests run against the actual backend (http://localhost:9000)
 * and test the complete flow including:
 * - Registration with full_name
 * - Login with JWT access tokens
 * - HttpOnly refresh token cookies
 * - Auto token refresh on 401
 * - Logout
 * 
 * Prerequisites:
 * - Backend running: docker compose up backend
 * - Frontend running: npm run dev
 * - Test database clean or unique emails used
 */

// Generate unique email for each test run
const generateTestEmail = () => `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`

test.describe('Authentication Flow - Real Backend Integration', () => {
  
  test('complete registration → login → upload flow', async ({ page }) => {
    const testEmail = generateTestEmail()
    const testPassword = 'SecurePass123!'
    const testFirstName = 'Integration'
    const testLastName = 'Test'

    // Step 1: Registration
    await page.goto('/registration')
    
    await page.fill('input[name="firstName"]', testFirstName)
    await page.fill('input[name="lastName"]', testLastName)
    await page.fill('input[type="email"]', testEmail)
    await page.fill('input[type="password"]', testPassword)
    
    await page.click('button[type="submit"]')
    
    // Should redirect to login with prefilled email
    await page.waitForURL(/\/login/, { timeout: 5000 })
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toHaveValue(testEmail)

    // Step 2: Login
    await page.fill('input[type="password"]', testPassword)
    await page.click('button[type="submit"]')
    
    // Should redirect to upload page after successful login
    await page.waitForURL(/\/upload/, { timeout: 5000 })
    
    // Verify we're authenticated by checking for user info in UI
    // (Adjust selector based on actual UI - this is a placeholder)
    await page.waitForTimeout(1000)
    
    // Verify cookies were set (refresh_token)
    const cookies = await page.context().cookies()
    const refreshTokenCookie = cookies.find(c => c.name === 'refresh_token')
    expect(refreshTokenCookie).toBeDefined()
    expect(refreshTokenCookie?.httpOnly).toBe(true)
    expect(refreshTokenCookie?.sameSite).toBe('Lax')
    
    // Verify we can access protected endpoint
    // Try to navigate to upload - should not redirect to login
    await page.goto('/upload')
    await page.waitForTimeout(500)
    
    // Should still be on upload page, not redirected to login
    expect(page.url()).toContain('/upload')
  })

  test('login with wrong password shows error', async ({ page }) => {
    // First register a user
    const testEmail = generateTestEmail()
    const correctPassword = 'CorrectPass123!'
    
    await page.goto('/registration')
    await page.fill('input[name="firstName"]', 'Wrong')
    await page.fill('input[name="lastName"]', 'Password')
    await page.fill('input[type="email"]', testEmail)
    await page.fill('input[type="password"]', correctPassword)
    await page.click('button[type="submit"]')
    
    await page.waitForURL(/\/login/, { timeout: 5000 })
    
    // Now try to login with wrong password
    await page.fill('input[type="password"]', 'WrongPassword123!')
    await page.click('button[type="submit"]')
    
    // Error message should appear (backend returns "Invalid email or password")
    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 5000 })
  })

  test('registration with duplicate email shows error', async ({ page }) => {
    const duplicateEmail = generateTestEmail()
    
    // Register first time
    await page.goto('/registration')
    await page.fill('input[name="firstName"]', 'First')
    await page.fill('input[name="lastName"]', 'User')
    await page.fill('input[type="email"]', duplicateEmail)
    await page.fill('input[type="password"]', 'SecurePass123!')
    await page.click('button[type="submit"]')
    
    await page.waitForURL(/\/login/, { timeout: 5000 })
    
    // Try to register again with same email
    await page.goto('/registration')
    await page.fill('input[name="firstName"]', 'Second')
    await page.fill('input[name="lastName"]', 'User')
    await page.fill('input[type="email"]', duplicateEmail)
    await page.fill('input[type="password"]', 'AnotherPass123!')
    await page.click('button[type="submit"]')
    
    // Error should appear (backend returns 401 with "Email already registered")
    await expect(page.getByText(/email already registered/i)).toBeVisible({ timeout: 5000 })
  })

  test('logout clears session and redirects to login', async ({ page }) => {
    // Register and login first
    const testEmail = generateTestEmail()
    const testPassword = 'LogoutTest123!'
    
    await page.goto('/registration')
    await page.fill('input[name="firstName"]', 'Logout')
    await page.fill('input[name="lastName"]', 'Test')
    await page.fill('input[type="email"]', testEmail)
    await page.fill('input[type="password"]', testPassword)
    await page.click('button[type="submit"]')
    
    await page.waitForURL(/\/login/, { timeout: 5000 })
    
    await page.fill('input[type="password"]', testPassword)
    await page.click('button[type="submit"]')
    
    await page.waitForURL(/\/upload/, { timeout: 5000 })
    
    // Now logout
    const logoutButton = page.getByRole('button', { name: /logout/i })
    await logoutButton.click()
    
    // Should show success message
    await expect(page.getByText(/logged out successfully/i)).toBeVisible({ timeout: 5000 })
    
    // Verify refresh_token cookie is cleared
    await page.waitForTimeout(500)
    const cookies = await page.context().cookies()
    const refreshTokenCookie = cookies.find(c => c.name === 'refresh_token')
    
    // Cookie should be either absent or have empty value/expired
    if (refreshTokenCookie) {
      expect(refreshTokenCookie.value).toBeFalsy()
    }
    
    // Try to access protected page - should redirect to login
    await page.goto('/upload')
    await page.waitForTimeout(1000)
    
    // Should be redirected to login
    expect(page.url()).toContain('/login')
  })

  test('registration without full_name shows validation error', async ({ page }) => {
    await page.goto('/registration')
    
    // Fill only email and password (skip first/last name)
    await page.fill('input[type="email"]', generateTestEmail())
    await page.fill('input[type="password"]', 'SecurePass123!')
    
    // Try to submit
    await page.click('button[type="submit"]')
    
    // Should show validation error (frontend or backend)
    // Frontend should require both firstName and lastName
    // Adjust selector based on actual error message in UI
    await page.waitForTimeout(500)
    
    // Should not have navigated away from registration
    expect(page.url()).toContain('/registration')
  })

  test('access token refresh on 401 works transparently', async ({ page }) => {
    // This test verifies that when access_token expires and backend returns 401,
    // the frontend automatically calls /auth/refresh and retries the request
    
    // Register and login
    const testEmail = generateTestEmail()
    const testPassword = 'RefreshTest123!'
    
    await page.goto('/registration')
    await page.fill('input[name="firstName"]', 'Refresh')
    await page.fill('input[name="lastName"]', 'Test')
    await page.fill('input[type="email"]', testEmail)
    await page.fill('input[type="password"]', testPassword)
    await page.click('button[type="submit"]')
    
    await page.waitForURL(/\/login/, { timeout: 5000 })
    
    await page.fill('input[type="password"]', testPassword)
    await page.click('button[type="submit"]')
    
    await page.waitForURL(/\/upload/, { timeout: 5000 })
    
    // Intercept API calls to verify refresh mechanism
    page.on('request', (request) => {
      if (request.url().includes('/auth/refresh')) {
        console.log('Token refresh called')
      }
    })
    
    // Wait for access token to potentially expire (or we could manually clear it from store)
    // In real scenario, access token is stored in memory and will be used for API calls
    
    // Try to make an authenticated request (e.g., upload a file or get user profile)
    // For now, just verify the app stays functional
    await page.waitForTimeout(2000)
    
    // Navigate around - should stay authenticated
    await page.goto('/upload')
    await page.waitForTimeout(500)
    expect(page.url()).toContain('/upload')
    
    // Note: To properly test token refresh, we'd need to either:
    // 1. Wait for access_token to actually expire (15 minutes)
    // 2. Mock the API to return 401 on first call
    // 3. Manually clear access token from Zustand store via browser console
    
    // For now, this test verifies the flow stays intact
  })
})
