# Testing Architecture Guide

## Overview

This document explains the testing architecture for the Portfolio Builder frontend. We use **three distinct types of tests**, each with a specific purpose and location.

---

## Test Types

### 1. Unit Tests (Vitest)

**Location**: `src/tests/unit/`

**Purpose**: Test individual components and functions in isolation

**Runner**: Vitest + @testing-library/react

**Mocking Strategy**: All external dependencies are mocked

**Examples**:
- `UploadArea.test.tsx` - Tests the UploadArea component UI logic
- `fileValidation.test.ts` - Tests file validation utility functions
- `resumeStore.test.ts` - Tests Zustand store logic

**When to use**:
- Testing component rendering logic
- Testing utility functions
- Testing state management stores
- Fast feedback during development

**Run command**:
```bash
npm test
```

---

### 2. Integration Tests (Vitest)

**Location**: `src/tests/integration/`

**Purpose**: Test feature workflows with mocked API services

**Runner**: Vitest + @testing-library/react

**Mocking Strategy**: 
- API services are mocked (using vi.mock)
- Real components and routing
- Real state management

**Examples**:
- `UploadCV.integration.test.tsx` - Tests the complete upload workflow with mocked uploadCV service

**When to use**:
- Testing multi-component interactions
- Testing user workflows within a feature
- Testing state changes across components
- Faster than E2E, more realistic than unit tests

**Run command**:
```bash
npm test
```

---

### 3. E2E Tests (Playwright)

**Location**: `tests/e2e/` ⚠️ **NOT in src!**

**Purpose**: Test complete user flows in a real browser

**Runner**: Playwright (real browser automation)

**Mocking Strategy**: Two variants:

#### Variant A: Mocked Backend (Faster)
- Files: `auth.spec.ts`, `uploadcv.spec.ts`
- Backend API calls are mocked using `page.route()`
- Good for testing UI flows without backend dependency
- Fast execution

#### Variant B: Real Backend (Full Integration)
- Files: `auth-integration.spec.ts`
- Requires Docker services running (`docker-compose up`)
- Tests against real backend endpoints
- Complete end-to-end validation

**When to use**:
- Testing critical user journeys
- Testing cross-browser compatibility
- Testing real backend integration
- Pre-deployment smoke tests

**Run commands**:
```bash
# E2E with mocked backend (fast)
npm run e2e

# E2E with real backend (requires Docker)
docker-compose up -d
npm run e2e:integration

# Interactive UI mode
npm run e2e:ui

# Headed mode (see browser)
npm run e2e:headed
```

---

## Test Architecture Decision

### Why Three Types?

**Speed vs. Realism Tradeoff**:
```
Unit Tests          Integration Tests       E2E Tests
    ↓                      ↓                     ↓
  Fast                  Medium                 Slow
  Isolated             Connected             Complete
  Many tests          Some tests            Few tests
```

**The Testing Pyramid**:
```
        /\
       /E2E\          ← Few (critical paths only)
      /------\
     /        \
    /Integration\     ← Some (feature workflows)
   /------------\
  /              \
 /  Unit Tests    \   ← Many (component logic)
/------------------\
```

### Why NOT in `src/tests/e2e/`?

**Reason**: Playwright tests are **NOT source code** - they're test automation scripts.

- `src/` = application source code (bundled by Vite)
- `tests/` = test automation scripts (run by Playwright)

**Configuration**:
- `vitest.config.ts` explicitly excludes `src/tests/e2e/**`
- `playwright.config.ts` points to `tests/e2e/`

---

## File Naming Conventions

| Test Type | File Pattern | Location | Example |
|-----------|-------------|----------|---------|
| **Unit** | `*.test.tsx` | `src/tests/unit/` | `UploadArea.test.tsx` |
| **Integration** | `*.integration.test.tsx` | `src/tests/integration/` | `UploadCV.integration.test.tsx` |
| **E2E (mocked)** | `*.spec.ts` | `tests/e2e/` | `auth.spec.ts` |
| **E2E (real backend)** | `*.integration.spec.ts` | `tests/e2e/` | `auth-integration.spec.ts` |

---

## Running Tests

### Local Development

```bash
# Run all unit + integration tests
npm test

# Run tests in watch mode (TDD)
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test UploadArea.test.tsx

# Run E2E tests (mocked backend)
npm run e2e

# Run E2E tests with UI
npm run e2e:ui
```

### Full Integration Testing

```bash
# 1. Start backend services
docker-compose up -d

# 2. Wait for services to be ready
docker-compose logs -f backend

# 3. Run integration E2E tests
npm run e2e:integration

# 4. Stop services
docker-compose down
```

---

## Best Practices

### Unit Tests
✅ **DO**:
- Test one component/function per file
- Mock all external dependencies
- Test edge cases and error states
- Keep tests fast (<100ms each)

❌ **DON'T**:
- Make real API calls
- Test implementation details
- Test multiple components together

### Integration Tests
✅ **DO**:
- Test complete user workflows
- Mock only external APIs (not internal components)
- Test state changes across components
- Use realistic test data

❌ **DON'T**:
- Test every edge case (use unit tests for that)
- Make real backend calls
- Test browser-specific behavior

### E2E Tests
✅ **DO**:
- Test critical happy paths
- Test real user scenarios
- Use page object pattern for reusability
- Test cross-browser when needed

❌ **DON'T**:
- Test every feature (too slow)
- Test unit-level logic
- Ignore test flakiness

---

## CI/CD Pipeline

**Recommended test execution order**:

```yaml
# .github/workflows/test.yml (example)
steps:
  1. Run linting (fast)
  2. Run unit tests (fast)
  3. Run integration tests (medium)
  4. Build application (medium)
  5. Run E2E mocked tests (slow)
  6. Start backend services (slow)
  7. Run E2E integration tests (slowest)
```

---

## Troubleshooting

### "Test not found" error
- Check file location matches test type
- Ensure file naming convention is correct
- Check vitest/playwright config excludes/includes

### "Cannot find module" in tests
- Check imports use correct paths
- Verify test setup files are loaded (setupTests.ts)
- Check tsconfig.json paths configuration

### E2E tests hanging
- Ensure backend services are running (for integration tests)
- Check network timeouts in playwright.config.ts
- Verify baseURL is correct (http://localhost:3000)

### Flaky E2E tests
- Add explicit waits for async operations
- Use `waitFor` utilities from Playwright
- Check for race conditions in test setup

---

## Further Reading

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Best Practices](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Pyramid Pattern](https://martinfowler.com/bliki/TestPyramid.html)

---

**Last Updated**: November 2025  
**Maintained By**: Frontend Team
