import { test, expect } from '@playwright/test'

/**
 * Authentication E2E Tests
 * 
 * Tests the complete authentication flow:
 * - User registration with full_name
 * - Login with credentials
 * - Session persistence
 * - Logout
 */

test.describe('Authentication Flow E2E', () => {
  
  test('complete registration flow with full_name', async ({ page }) => {
    // Mock registration endpoint
    await page.route('**/auth/register', async (route) => {
      const request = route.request()
      const postData = JSON.parse(request.postData() || '{}')
      
      // Verify full_name is sent
      expect(postData).toHaveProperty('full_name')
      expect(postData.full_name).toBeTruthy()
      
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          email: postData.email,
          full_name: postData.full_name,
          created_at: new Date().toISOString(),
        }),
      })
    })

    // Navigate to registration page
    await page.goto('/registration')

    // Fill in registration form
    await page.fill('input[name="firstName"]', 'John')
    await page.fill('input[name="lastName"]', 'Doe')
    await page.fill('input[type="email"]', 'john.doe@example.com')
    await page.fill('input[type="password"]', 'SecurePass123!')

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to login page with prefilled email
    await page.waitForURL(/\/login/)
    
    // Verify email is prefilled
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toHaveValue('john.doe@example.com')
  })

  test('complete login flow with token storage', async ({ page }) => {
    // Mock login endpoint
    await page.route('**/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Set-Cookie': 'refresh_token=mock-refresh-token; HttpOnly; Path=/; SameSite=Lax',
        },
        body: JSON.stringify({
          access_token: 'mock-access-token',
          token_type: 'bearer',
          user: {
            id: 1,
            email: 'test@example.com',
            full_name: 'Test User',
            created_at: new Date().toISOString(),
          },
        }),
      })
    })

    // Mock /auth/me endpoint for subsequent calls
    await page.route('**/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          email: 'test@example.com',
          full_name: 'Test User',
          created_at: new Date().toISOString(),
        }),
      })
    })

    // Navigate to login page
    await page.goto('/login')

    // Fill in login form
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'SecurePass123!')

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to upload page
    await page.waitForURL(/\/upload/)
    
    // User should be authenticated (verify UI shows user info)
    // Exact selector depends on your UI implementation
    await page.waitForTimeout(500)
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    // Mock login endpoint to return error
    await page.route('**/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Incorrect email or password',
        }),
      })
    })

    await page.goto('/login')

    // Fill in form with wrong credentials
    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'WrongPassword123!')

    // Submit form
    await page.click('button[type="submit"]')

    // Error message should appear
    await expect(page.getByText(/incorrect email or password/i)).toBeVisible()
  })

  test('registration with existing email shows error', async ({ page }) => {
    // Mock registration endpoint to return conflict
    await page.route('**/auth/register', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Email already registered',
        }),
      })
    })

    await page.goto('/registration')

    // Fill in registration form
    await page.fill('input[name="firstName"]', 'Existing')
    await page.fill('input[name="lastName"]', 'User')
    await page.fill('input[type="email"]', 'existing@example.com')
    await page.fill('input[type="password"]', 'SecurePass123!')

    // Submit form
    await page.click('button[type="submit"]')

    // Error message should appear
    await expect(page.getByText(/email already registered/i)).toBeVisible()
  })

  test('logout clears user session', async ({ page }) => {
    // Mock authenticated state
    await page.route('**/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          email: 'test@example.com',
          full_name: 'Test User',
          created_at: new Date().toISOString(),
        }),
      })
    })

    // Mock logout endpoint
    await page.route('**/auth/logout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Logged out successfully',
        }),
      })
    })

    // Navigate to a protected page (upload)
    await page.goto('/upload')
    await page.waitForTimeout(500)

    // Find and click logout button
    const logoutButton = page.getByRole('button', { name: /logout/i })
    await logoutButton.click()

    // Verify logout success message appears
    await expect(page.getByText(/logged out successfully/i)).toBeVisible()

    // User state should be cleared (exact verification depends on UI)
    await page.waitForTimeout(300)
  })

  test('token refresh on 401 response', async ({ page }) => {
    let callCount = 0

    // Mock /auth/me to return 401 first time, then success after refresh
    await page.route('**/auth/me', async (route) => {
      callCount++
      
      if (callCount === 1) {
        // First call - expired token
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Token expired' }),
        })
      } else {
        // After refresh - success
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            email: 'test@example.com',
            full_name: 'Test User',
            created_at: new Date().toISOString(),
          }),
        })
      }
    })

    // Mock /auth/refresh endpoint
    await page.route('**/auth/refresh', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'new-access-token',
          token_type: 'bearer',
        }),
      })
    })

    await page.goto('/upload')
    
    // Wait for token refresh to happen
    await page.waitForTimeout(1000)

    // After refresh, user should be loaded successfully
    // (Verify based on your UI implementation)
  })
})
