import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    headless: false,
    video: 'on',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    // Slow down so you can "see it happening on screen"
    launchOptions: { slowMo: 200 },
  },
  webServer: {
    command: 'npm run dev -- --port=3000 --strictPort',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
