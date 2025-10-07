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

test.describe('UploadCV E2E', () => {
  test('successful upload flow (visible, headed, with delay)', async ({ page }) => {
    // Intercept the upload API and delay the response so the UI shows Uploading…
    await page.route('**/resumes/upload', async (route) => {
      await page.waitForTimeout(800) // small delay for visual feedback
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Uploaded OK',
          data: {
            fileId: 'e2e-123',
            extractedData: {
              full_text: 'hello world',
              parsed: { name: 'E2E Tester' },
              file_info: { filename: 'cv.pdf', content_type: 'application/pdf' },
            },
          },
        }),
      })
    })

    // Navigate to the app root (App.tsx renders UploadCV)
    await page.goto('/')

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

    // Expect success toast to appear
    await expect(page.getByText('Uploaded OK')).toBeVisible()
  })

  test('failed upload shows error toast', async ({ page }) => {
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

    const input = page.locator('#file-input')
    const tempFile = makeTempFile()
    await input.setInputFiles({ name: tempFile.name, mimeType: tempFile.mimeType, buffer: tempFile.buffer })

    const cta = page.getByRole('button', { name: /let's do it!/i })
    await cta.click()

    await expect(page.getByText('Upload failed due to server error')).toBeVisible()
  })
})
