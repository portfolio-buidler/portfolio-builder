import { test, expect } from '@playwright/test'

// Helper to create a temporary file in memory using Node Buffer
function makeTempFile(path = 'cv.pdf', content = 'resume content') {
  const buffer = Buffer.from(content, 'utf-8')
  return {
    name: path,
    mimeType: 'application/pdf',
    buffer,
  }
}

/**
 * Setup auth mocking for authenticated tests
 * Mocks /auth/me to return a logged-in user
 */
async function setupAuthMock(page: any) {
  // Mock /auth/me to simulate logged-in user
  await page.route('**/auth/me', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 1,
        email: 'e2etest@example.com',
        full_name: 'E2E Test User',
        created_at: new Date().toISOString(),
      }),
    })
  })

  // Mock /auth/logout to simulate successful logout
  await page.route('**/auth/logout', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Logged out successfully' }),
    })
  })
}

test.describe('UploadCV E2E', () => {
  test('successful upload flow with authenticated user', async ({ page }) => {
    // Setup auth mock first
    await setupAuthMock(page)

    // Intercept the upload API and delay the response so the UI shows Uploading…
    await page.route('**/resumes/upload', async (route) => {
      await page.waitForTimeout(800) // small delay for visual feedback
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 123,
          status: 'parsed',
          message: 'Resume uploaded and parsed successfully',
          parsed_data: {
            contact: { name: 'E2E Tester', email: 'test@example.com' },
            experience: [],
            education: [],
            skills: [],
          },
          file_name: 'cv.pdf',
          uploaded_at: new Date().toISOString(),
        }),
      })
    })

    // Navigate to the app root
    await page.goto('/')

    // Wait for auth check to complete (user should be loaded)
    await page.waitForTimeout(500)

    // Verify CTA initially disabled
    const cta = page.getByRole('button', { name: /let's do it!/i })
    await expect(cta).toBeDisabled()

    // Set file on the hidden input
    const input = page.locator('#file-input')
    const tempFile = makeTempFile()
    await input.setInputFiles({ name: tempFile.name, mimeType: tempFile.mimeType, buffer: tempFile.buffer })

    // CTA should become enabled
    await expect(cta).toBeEnabled()

    // Click CTA to trigger upload
    await cta.click()

    // Expect success message to appear
    await expect(page.getByText(/uploaded and parsed successfully/i)).toBeVisible()
  })

  test('unauthenticated user is redirected to login', async ({ page }) => {
    // Mock /auth/me to return 401 (not authenticated)
    await page.route('**/auth/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Not authenticated' }),
      })
    })

    // Navigate to upload page
    await page.goto('/')

    // Should redirect to login
    await page.waitForURL(/\/login/)
    
    // Verify we're on the login page
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible()
  })

  test('failed upload shows error toast', async ({ page }) => {
    // Setup auth mock
    await setupAuthMock(page)

    // Intercept to return a failure
    await page.route('**/resumes/upload', async (route) => {
      await page.waitForTimeout(300)
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Upload failed due to server error' }),
      })
    })

    await page.goto('/')
    await page.waitForTimeout(500)

    const input = page.locator('#file-input')
    const tempFile = makeTempFile()
    await input.setInputFiles({ name: tempFile.name, mimeType: tempFile.mimeType, buffer: tempFile.buffer })

    const cta = page.getByRole('button', { name: /let's do it!/i })
    await cta.click()

    await expect(page.getByText(/Upload failed due to server error/i)).toBeVisible()
  })

  test('user can logout from upload page', async ({ page }) => {
    // Setup auth mock
    await setupAuthMock(page)

    await page.goto('/')
    await page.waitForTimeout(500)

    // Find and click logout button (exact selector depends on your UI)
    const logoutButton = page.getByRole('button', { name: /logout/i })
    await expect(logoutButton).toBeVisible()
    
    await logoutButton.click()

    // After logout, user should be cleared and component should show login prompt
    // (Exact behavior depends on your UI - adjust as needed)
    await page.waitForTimeout(300)
  })
})

