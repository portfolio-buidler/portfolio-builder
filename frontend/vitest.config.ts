import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: [
      'src/tests/unit/**/*.test.{ts,tsx}',
      'src/tests/integration/**/*.test.{ts,tsx}',
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      // Exclude Playwright e2e tests from Vitest
      'src/tests/e2e/**',
      '**/*.e2e.*',
      'playwright-report/**',
      'test-results/**'
    ],
    setupFiles: ['src/tests/setupTests.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  },
})
